import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import { MemorySessionStore } from '../src/handshake/session-store.js';
import { createHandshakeHandler } from '../src/handshake/handshake-handler.js';
import {
    generateKeyPair,
    deriveSharedKeys,
    encodePublicKey,
} from '../src/handshake/ecdh.js';
import { createAutoDecrypt } from '../src/middleware/auto-decrypt.js';
import { createAutoEncrypt } from '../src/middleware/auto-encrypt.js';
import { createE2EEPipeline } from '../src/middleware/e2ee-pipeline.js';
import {
    encryptEnvelope,
    decryptEnvelope,
    serializeEnvelope,
    parseEnvelope,
} from '../src/codec/envelope.js';
import {
    ratchetKey,
    needsRotation,
    rotateSessionKey,
} from '../src/handshake/key-ratchet.js';
import type { E2EESession } from '../src/types.js';

describe('Handshake Handler', () => {
    let store: MemorySessionStore;

    beforeEach(() => {
        store = new MemorySessionStore({ ttlMs: 60_000 });
    });

    afterEach(() => {
        store.destroy();
    });

    it('should establish a session via handshake', async () => {
        const handler = createHandshakeHandler(store);
        const clientKp = generateKeyPair();

        const response = await handler({
            clientPublicKey: encodePublicKey(clientKp.publicKey),
        });

        expect(response.sessionId).toBeTruthy();
        expect(response.serverPublicKey).toBeTruthy();
        expect(response.rotationIntervalMs).toBeGreaterThan(0);

        // Session should be stored
        const session = await store.get(response.sessionId);
        expect(session).not.toBeNull();
        expect(session!.requestCount).toBe(0);
    });

    it('should allow both sides to derive matching keys', async () => {
        const handler = createHandshakeHandler(store);
        const clientKp = generateKeyPair();

        const response = await handler({
            clientPublicKey: encodePublicKey(clientKp.publicKey),
        });

        // Client derives keys using server's public key
        const serverPubKey = Buffer.from(response.serverPublicKey, 'base64url');
        const clientKeys = deriveSharedKeys(clientKp.privateKey, serverPubKey);

        // Server's stored keys
        const session = await store.get(response.sessionId);
        expect(session).not.toBeNull();

        // Keys must match (ECDH shared secret symmetry)
        expect(session!.encryptionKey.equals(clientKeys.encryptionKey)).toBe(true);
        expect(session!.macKey.equals(clientKeys.macKey)).toBe(true);
    });

    it('should reject missing clientPublicKey', async () => {
        const handler = createHandshakeHandler(store);
        await expect(handler({ clientPublicKey: '' })).rejects.toThrow();
    });
});

describe('Auto-Decrypt Middleware', () => {
    let store: MemorySessionStore;

    beforeEach(() => {
        store = new MemorySessionStore({ ttlMs: 60_000 });
    });
    afterEach(() => store.destroy());

    it('should pass through non-encrypted requests', async () => {
        const autoDecrypt = createAutoDecrypt(store);
        const result = await autoDecrypt({
            rawBody: '{"hello":"world"}',
            getHeader: () => undefined,
            setDecryptedBody: () => { },
            setSessionId: () => { },
        });

        expect(result.success).toBe(true);
    });

    it('should reject encrypted request without session ID', async () => {
        const autoDecrypt = createAutoDecrypt(store);
        const result = await autoDecrypt({
            rawBody: '...',
            getHeader: (name) => name === 'x-gao-encrypted' ? '1' : undefined,
            setDecryptedBody: () => { },
            setSessionId: () => { },
        });

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
    });

    it('should reject encrypted request with invalid session', async () => {
        const autoDecrypt = createAutoDecrypt(store);
        const result = await autoDecrypt({
            rawBody: '...',
            getHeader: (name) => {
                if (name === 'x-gao-encrypted') return '1';
                if (name === 'x-gao-session-id') return 'invalid-session';
                return undefined;
            },
            setDecryptedBody: () => { },
            setSessionId: () => { },
        });

        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(401);
    });

    it('should decrypt a valid encrypted request body', async () => {
        // Setup: create a session via handshake
        const handler = createHandshakeHandler(store);
        const clientKp = generateKeyPair();
        const handshakeResp = await handler({
            clientPublicKey: encodePublicKey(clientKp.publicKey),
        });

        // Client derives keys
        const serverPubKey = Buffer.from(handshakeResp.serverPublicKey, 'base64url');
        const clientKeys = deriveSharedKeys(clientKp.privateKey, serverPubKey);

        // Client encrypts a request body
        const plainBody = JSON.stringify({ action: 'createUser', name: 'Alice' });
        const envelope = encryptEnvelope(plainBody, clientKeys.encryptionKey, 1);
        const serialized = serializeEnvelope(envelope);

        // Server auto-decrypts
        const autoDecrypt = createAutoDecrypt(store);
        let decryptedBody: unknown;
        let capturedSessionId: string | undefined;

        const result = await autoDecrypt({
            rawBody: serialized,
            getHeader: (name) => {
                if (name === 'x-gao-encrypted') return '1';
                if (name === 'x-gao-session-id') return handshakeResp.sessionId;
                return undefined;
            },
            setDecryptedBody: (body) => { decryptedBody = body; },
            setSessionId: (id) => { capturedSessionId = id; },
        });

        expect(result.success).toBe(true);
        expect(decryptedBody).toEqual({ action: 'createUser', name: 'Alice' });
        expect(capturedSessionId).toBe(handshakeResp.sessionId);
    });
});

describe('Auto-Encrypt Middleware', () => {
    let store: MemorySessionStore;

    beforeEach(() => {
        store = new MemorySessionStore({ ttlMs: 60_000 });
    });
    afterEach(() => store.destroy());

    it('should not encrypt when no session ID', async () => {
        const autoEncrypt = createAutoEncrypt(store);
        const encrypted = await autoEncrypt({
            sessionId: undefined,
            responseBody: '{"ok":true}',
            setEncryptedBody: () => { },
            setHeader: () => { },
        });

        expect(encrypted).toBe(false);
    });

    it('should encrypt response for active session', async () => {
        // Setup session
        const handler = createHandshakeHandler(store);
        const clientKp = generateKeyPair();
        const resp = await handler({
            clientPublicKey: encodePublicKey(clientKp.publicKey),
        });

        const autoEncrypt = createAutoEncrypt(store);
        let encryptedBody = '';
        const headers: Record<string, string> = {};

        const result = await autoEncrypt({
            sessionId: resp.sessionId,
            responseBody: JSON.stringify({ user: 'Alice', role: 'admin' }),
            setEncryptedBody: (body) => { encryptedBody = body; },
            setHeader: (name, value) => { headers[name] = value; },
        });

        expect(result).toBe(true);
        expect(encryptedBody).toBeTruthy();
        expect(headers['x-gao-encrypted']).toBe('1');

        // Client should be able to decrypt
        const serverPubKey = Buffer.from(resp.serverPublicKey, 'base64url');
        const clientKeys = deriveSharedKeys(clientKp.privateKey, serverPubKey);

        const envelope = parseEnvelope(encryptedBody);
        const decrypted = decryptEnvelope(envelope, clientKeys.encryptionKey);
        expect(JSON.parse(decrypted)).toEqual({ user: 'Alice', role: 'admin' });
    });
});

describe('Key Ratchet', () => {
    it('should produce a different key after ratcheting', () => {
        const original = randomBytes(32);
        const ratcheted = ratchetKey(original);

        expect(ratcheted.length).toBe(32);
        expect(ratcheted.equals(original)).toBe(false);
    });

    it('should be deterministic — same input produces same output', () => {
        const key = randomBytes(32);
        const keyCopy = Buffer.from(key);
        const r1 = ratchetKey(key);
        const r2 = ratchetKey(keyCopy);
        expect(r1.equals(r2)).toBe(true);
    });

    it('should detect rotation needed by time', () => {
        const session: E2EESession = {
            sessionId: 'test',
            encryptionKey: randomBytes(32),
            macKey: randomBytes(32),
            createdAt: Date.now() - 7_200_000, // 2 hours ago
            requestCount: 0,
            lastRotatedAt: Date.now() - 7_200_000, // 2 hours ago
            lastSeq: 0,
            clientPublicKey: randomBytes(32),
            serverPublicKey: randomBytes(32),
            serverPrivateKey: randomBytes(32),
        };

        expect(needsRotation(session, {
            store: new MemorySessionStore(),
            rotationIntervalMs: 3_600_000, // 1 hour
        })).toBe(true);
    });

    it('should detect rotation needed by request count', () => {
        const session: E2EESession = {
            sessionId: 'test',
            encryptionKey: randomBytes(32),
            macKey: randomBytes(32),
            createdAt: Date.now(),
            requestCount: 15_000,
            lastRotatedAt: Date.now(),
            lastSeq: 0,
            clientPublicKey: randomBytes(32),
            serverPublicKey: randomBytes(32),
            serverPrivateKey: randomBytes(32),
        };

        expect(needsRotation(session, {
            store: new MemorySessionStore(),
            maxRequestsBeforeRotation: 10_000,
        })).toBe(true);
    });

    it('should not need rotation when below thresholds', () => {
        const session: E2EESession = {
            sessionId: 'test',
            encryptionKey: randomBytes(32),
            macKey: randomBytes(32),
            createdAt: Date.now(),
            requestCount: 5,
            lastRotatedAt: Date.now(),
            lastSeq: 0,
            clientPublicKey: randomBytes(32),
            serverPublicKey: randomBytes(32),
            serverPrivateKey: randomBytes(32),
        };

        expect(needsRotation(session, {
            store: new MemorySessionStore(),
        })).toBe(false);
    });

    it('should rotateSessionKey and update the store', async () => {
        const store = new MemorySessionStore();
        const originalKey = randomBytes(32);
        const originalKeyCopy = Buffer.from(originalKey);
        const session: E2EESession = {
            sessionId: 'rotate-test',
            encryptionKey: originalKey,
            macKey: randomBytes(32),
            createdAt: Date.now(),
            requestCount: 100,
            lastRotatedAt: Date.now() - 7_200_000,
            lastSeq: 0,
            clientPublicKey: randomBytes(32),
            serverPublicKey: randomBytes(32),
            serverPrivateKey: randomBytes(32),
        };

        await store.set(session);
        const updated = await rotateSessionKey(session, store);

        // New key should be different
        expect(updated.encryptionKey.equals(originalKeyCopy)).toBe(false);
        // Request count should be reset
        expect(updated.requestCount).toBe(0);
        // Old key should be wiped (zeroed)
        expect(originalKey.every(b => b === 0)).toBe(true);
        // Store should have the updated session
        const stored = await store.get('rotate-test');
        expect(stored!.encryptionKey.equals(updated.encryptionKey)).toBe(true);

        store.destroy();
    });
});

describe('E2EE Pipeline', () => {
    it('should create a pipeline with defaults', () => {
        const pipeline = createE2EEPipeline();
        expect(pipeline.handshakePath).toBe('/gao/handshake');
        expect(pipeline.enforceEncryption).toBe(false);
    });

    it('shouldProcess should exclude handshake path', () => {
        const pipeline = createE2EEPipeline();
        expect(pipeline.shouldProcess('/gao/handshake')).toBe(false);
        expect(pipeline.shouldProcess('/api/users')).toBe(true);
    });

    it('shouldProcess should exclude configured paths', () => {
        const pipeline = createE2EEPipeline({
            excludePaths: ['/health', '/static/'],
        });
        expect(pipeline.shouldProcess('/health')).toBe(false);
        expect(pipeline.shouldProcess('/static/main.js')).toBe(false);
        expect(pipeline.shouldProcess('/api/data')).toBe(true);
    });

    it('should perform full E2EE round-trip via pipeline', async () => {
        const pipeline = createE2EEPipeline();

        // Step 1: Client generates key pair
        const clientKp = generateKeyPair();

        // Step 2: Handshake
        const handshakeResp = await pipeline.handleHandshake({
            clientPublicKey: encodePublicKey(clientKp.publicKey),
        });

        // Step 3: Client derives keys
        const serverPubKey = Buffer.from(handshakeResp.serverPublicKey, 'base64url');
        const clientKeys = deriveSharedKeys(clientKp.privateKey, serverPubKey);

        // Step 4: Client encrypts a request
        const requestPayload = { method: 'POST', data: { email: 'alice@test.com' } };
        const requestEnvelope = encryptEnvelope(
            JSON.stringify(requestPayload),
            clientKeys.encryptionKey,
            1,
        );
        const serializedRequest = serializeEnvelope(requestEnvelope);

        // Step 5: Server auto-decrypts
        let decryptedBody: unknown;
        const decryptResult = await pipeline.autoDecrypt({
            rawBody: serializedRequest,
            getHeader: (name) => {
                if (name === 'x-gao-encrypted') return '1';
                if (name === 'x-gao-session-id') return handshakeResp.sessionId;
                return undefined;
            },
            setDecryptedBody: (body) => { decryptedBody = body; },
            setSessionId: () => { },
        });

        expect(decryptResult.success).toBe(true);
        expect(decryptedBody).toEqual(requestPayload);

        // Step 6: Server processes and auto-encrypts response
        const serverResponse = JSON.stringify({ success: true, userId: 'u_123' });
        let encryptedResponse = '';

        await pipeline.autoEncrypt({
            sessionId: handshakeResp.sessionId,
            responseBody: serverResponse,
            setEncryptedBody: (body) => { encryptedResponse = body; },
            setHeader: () => { },
        });

        // Step 7: Client decrypts response
        const responseEnvelope = parseEnvelope(encryptedResponse);
        const decryptedResponse = decryptEnvelope(responseEnvelope, clientKeys.encryptionKey);
        expect(JSON.parse(decryptedResponse)).toEqual({ success: true, userId: 'u_123' });
    });
});
