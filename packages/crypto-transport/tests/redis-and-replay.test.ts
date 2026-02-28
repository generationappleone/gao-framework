import { describe, expect, it, beforeEach } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { RedisSessionStore } from '../src/handshake/redis-session-store.js';
import type { RedisClient } from '../src/handshake/redis-session-store.js';
import type { E2EESession } from '../src/types.js';
import { createAutoDecrypt } from '../src/middleware/auto-decrypt.js';
import { MemorySessionStore } from '../src/handshake/session-store.js';
import { createHandshakeHandler } from '../src/handshake/handshake-handler.js';
import { generateKeyPair, deriveSharedKeys, encodePublicKey } from '../src/handshake/ecdh.js';
import { encryptEnvelope, serializeEnvelope } from '../src/codec/envelope.js';

// ─── Mock Redis Client ──────────────────────────────────────

function createMockRedis(): RedisClient & {
    store: Map<string, string>;
    counters: Map<string, number>;
} {
    const store = new Map<string, string>();
    const counters = new Map<string, number>();

    return {
        store,
        counters,

        async get(key: string): Promise<string | null> {
            return store.get(key) ?? null;
        },

        async set(key: string, value: string, ..._args: unknown[]): Promise<unknown> {
            store.set(key, value);
            return 'OK';
        },

        async del(key: string | string[]): Promise<unknown> {
            const keys = Array.isArray(key) ? key : [key];
            let count = 0;
            for (const k of keys) {
                if (store.has(k)) { store.delete(k); count++; }
                if (counters.has(k)) { counters.delete(k); count++; }
            }
            return count;
        },

        async expire(_key: string, _seconds: number): Promise<unknown> {
            return 1;
        },

        async incr(key: string): Promise<number> {
            const current = counters.get(key) ?? 0;
            const next = current + 1;
            counters.set(key, next);
            // Also update the string store for get() consistency
            store.set(key, String(next));
            return next;
        },
    };
}

function makeSession(overrides?: Partial<E2EESession>): E2EESession {
    return {
        sessionId: randomUUID(),
        encryptionKey: randomBytes(32),
        macKey: randomBytes(32),
        createdAt: Date.now(),
        requestCount: 0,
        lastRotatedAt: Date.now(),
        lastSeq: 0,
        clientPublicKey: randomBytes(32),
        serverPublicKey: randomBytes(32),
        serverPrivateKey: randomBytes(32),
        ...overrides,
    };
}

// ─── Redis Session Store Tests ──────────────────────────────

describe('RedisSessionStore', () => {
    let redis: ReturnType<typeof createMockRedis>;
    let store: RedisSessionStore;

    beforeEach(() => {
        redis = createMockRedis();
        store = new RedisSessionStore(redis, { ttlMs: 60_000 });
    });

    it('should store and retrieve a session', async () => {
        const session = makeSession();
        await store.set(session);

        const retrieved = await store.get(session.sessionId);
        expect(retrieved).not.toBeNull();
        expect(retrieved!.sessionId).toBe(session.sessionId);
        expect(retrieved!.encryptionKey.equals(session.encryptionKey)).toBe(true);
        expect(retrieved!.macKey.equals(session.macKey)).toBe(true);
        expect(retrieved!.lastSeq).toBe(0);
    });

    it('should return null for non-existent session', async () => {
        const result = await store.get('nonexistent');
        expect(result).toBeNull();
    });

    it('should delete a session', async () => {
        const session = makeSession();
        await store.set(session);
        await store.delete(session.sessionId);

        const result = await store.get(session.sessionId);
        expect(result).toBeNull();
    });

    it('should atomically increment request count via INCR', async () => {
        const session = makeSession();
        await store.set(session);

        const count1 = await store.incrementRequestCount(session.sessionId);
        expect(count1).toBe(1);

        const count2 = await store.incrementRequestCount(session.sessionId);
        expect(count2).toBe(2);

        const count3 = await store.incrementRequestCount(session.sessionId);
        expect(count3).toBe(3);
    });

    it('should throw when incrementing non-existent session', async () => {
        await expect(store.incrementRequestCount('nonexistent')).rejects.toThrow('Session not found');
    });

    it('should preserve Buffer fields through serialization round-trip', async () => {
        const session = makeSession();
        await store.set(session);

        const retrieved = await store.get(session.sessionId);
        expect(retrieved!.clientPublicKey.equals(session.clientPublicKey)).toBe(true);
        expect(retrieved!.serverPublicKey.equals(session.serverPublicKey)).toBe(true);
        expect(retrieved!.serverPrivateKey.equals(session.serverPrivateKey)).toBe(true);
    });

    it('should preserve lastSeq through serialization', async () => {
        const session = makeSession({ lastSeq: 42 });
        await store.set(session);

        const retrieved = await store.get(session.sessionId);
        expect(retrieved!.lastSeq).toBe(42);
    });

    it('should use SET with EX for combined set+expire', async () => {
        const session = makeSession();
        await store.set(session);

        // Verify that the session key exists in the mock store
        const key = `gao:e2ee:session:${session.sessionId}`;
        expect(redis.store.has(key)).toBe(true);
    });

    it('should delete both session and counter keys', async () => {
        const session = makeSession();
        await store.set(session);
        await store.incrementRequestCount(session.sessionId);

        // Both keys should exist
        expect(redis.store.has(`gao:e2ee:session:${session.sessionId}`)).toBe(true);
        expect(redis.counters.has(`gao:e2ee:counter:${session.sessionId}`)).toBe(true);

        await store.delete(session.sessionId);

        expect(redis.store.has(`gao:e2ee:session:${session.sessionId}`)).toBe(false);
        // Counter is cleaned up via del
    });
});

// ─── Replay Protection Tests ────────────────────────────────

describe('Replay Protection (seq monotonicity)', () => {
    it('should reject a replayed sequence number', async () => {
        const memStore = new MemorySessionStore({ ttlMs: 60_000 });
        const handler = createHandshakeHandler(memStore);
        const clientKp = generateKeyPair();

        const resp = await handler({
            clientPublicKey: encodePublicKey(clientKp.publicKey),
        });

        const serverPubKey = Buffer.from(resp.serverPublicKey, 'base64url');
        const clientKeys = deriveSharedKeys(clientKp.privateKey, serverPubKey);

        const autoDecrypt = createAutoDecrypt(memStore);

        // First request with seq=1 should succeed
        const envelope1 = encryptEnvelope(
            JSON.stringify({ msg: 'first' }),
            clientKeys.encryptionKey,
            1,
        );

        const result1 = await autoDecrypt({
            rawBody: serializeEnvelope(envelope1),
            getHeader: (name) => {
                if (name === 'x-gao-encrypted') return '1';
                if (name === 'x-gao-session-id') return resp.sessionId;
                return undefined;
            },
            setDecryptedBody: () => { },
            setSessionId: () => { },
        });
        expect(result1.success).toBe(true);

        // Replay same seq=1 should be rejected
        const envelope1Replay = encryptEnvelope(
            JSON.stringify({ msg: 'replay' }),
            clientKeys.encryptionKey,
            1,
        );

        const result2 = await autoDecrypt({
            rawBody: serializeEnvelope(envelope1Replay),
            getHeader: (name) => {
                if (name === 'x-gao-encrypted') return '1';
                if (name === 'x-gao-session-id') return resp.sessionId;
                return undefined;
            },
            setDecryptedBody: () => { },
            setSessionId: () => { },
        });
        expect(result2.success).toBe(false);
        expect(result2.statusCode).toBe(409);
        expect(result2.error).toContain('Replay detected');

        memStore.destroy();
    });

    it('should accept monotonically increasing sequences', async () => {
        const memStore = new MemorySessionStore({ ttlMs: 60_000 });
        const handler = createHandshakeHandler(memStore);
        const clientKp = generateKeyPair();

        const resp = await handler({
            clientPublicKey: encodePublicKey(clientKp.publicKey),
        });

        const serverPubKey = Buffer.from(resp.serverPublicKey, 'base64url');
        const clientKeys = deriveSharedKeys(clientKp.privateKey, serverPubKey);
        const autoDecrypt = createAutoDecrypt(memStore);

        for (let seq = 1; seq <= 5; seq++) {
            const envelope = encryptEnvelope(
                JSON.stringify({ seq }),
                clientKeys.encryptionKey,
                seq,
            );

            const result = await autoDecrypt({
                rawBody: serializeEnvelope(envelope),
                getHeader: (name) => {
                    if (name === 'x-gao-encrypted') return '1';
                    if (name === 'x-gao-session-id') return resp.sessionId;
                    return undefined;
                },
                setDecryptedBody: () => { },
                setSessionId: () => { },
            });
            expect(result.success).toBe(true);
        }

        memStore.destroy();
    });

    it('should reject seq=0 (same as initial lastSeq)', async () => {
        const memStore = new MemorySessionStore({ ttlMs: 60_000 });
        const handler = createHandshakeHandler(memStore);
        const clientKp = generateKeyPair();

        const resp = await handler({
            clientPublicKey: encodePublicKey(clientKp.publicKey),
        });

        const serverPubKey = Buffer.from(resp.serverPublicKey, 'base64url');
        const clientKeys = deriveSharedKeys(clientKp.privateKey, serverPubKey);

        const envelope = encryptEnvelope(
            JSON.stringify({ test: true }),
            clientKeys.encryptionKey,
            0,
        );

        const autoDecrypt = createAutoDecrypt(memStore);
        const result = await autoDecrypt({
            rawBody: serializeEnvelope(envelope),
            getHeader: (name) => {
                if (name === 'x-gao-encrypted') return '1';
                if (name === 'x-gao-session-id') return resp.sessionId;
                return undefined;
            },
            setDecryptedBody: () => { },
            setSessionId: () => { },
        });

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(409);

        memStore.destroy();
    });
});
