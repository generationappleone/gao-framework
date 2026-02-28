import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemorySessionStore } from '../src/handshake/session-store.js';
import type { E2EESession } from '../src/types.js';
import { randomBytes, randomUUID } from 'node:crypto';

function createMockSession(overrides?: Partial<E2EESession>): E2EESession {
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

describe('MemorySessionStore', () => {
    let store: MemorySessionStore;

    beforeEach(() => {
        store = new MemorySessionStore({ ttlMs: 60_000, cleanupIntervalMs: 600_000 });
    });

    afterEach(() => {
        store.destroy();
    });

    it('should store and retrieve a session', async () => {
        const session = createMockSession();
        await store.set(session);

        const retrieved = await store.get(session.sessionId);
        expect(retrieved).not.toBeNull();
        expect(retrieved!.sessionId).toBe(session.sessionId);
        expect(retrieved!.encryptionKey.equals(session.encryptionKey)).toBe(true);
    });

    it('should return null for non-existent session', async () => {
        const result = await store.get('non-existent-id');
        expect(result).toBeNull();
    });

    it('should delete a session', async () => {
        const session = createMockSession();
        await store.set(session);
        await store.delete(session.sessionId);

        const result = await store.get(session.sessionId);
        expect(result).toBeNull();
    });

    it('should increment request count', async () => {
        const session = createMockSession({ requestCount: 0 });
        await store.set(session);

        const count1 = await store.incrementRequestCount(session.sessionId);
        expect(count1).toBe(1);

        const count2 = await store.incrementRequestCount(session.sessionId);
        expect(count2).toBe(2);
    });

    it('should throw on incrementing non-existent session', async () => {
        await expect(store.incrementRequestCount('missing')).rejects.toThrow('Session not found');
    });

    it('should evict expired sessions on get()', async () => {
        const expiredSession = createMockSession({
            createdAt: Date.now() - 120_000, // 2 minutes ago, TTL is 1 minute
        });
        await store.set(expiredSession);

        const result = await store.get(expiredSession.sessionId);
        expect(result).toBeNull();
        expect(store.size).toBe(0);
    });

    it('should track the number of active sessions', async () => {
        expect(store.size).toBe(0);

        await store.set(createMockSession());
        await store.set(createMockSession());
        expect(store.size).toBe(2);

        store.destroy();
        expect(store.size).toBe(0);
    });
});
