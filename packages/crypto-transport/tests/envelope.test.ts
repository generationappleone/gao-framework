import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import {
    encryptEnvelope,
    decryptEnvelope,
    serializeEnvelope,
    parseEnvelope,
} from '../src/codec/envelope.js';

describe('Envelope Codec', () => {
    const key = randomBytes(32);

    // ─── Encrypt / Decrypt ───────────────────────────────────

    describe('encryptEnvelope / decryptEnvelope', () => {
        it('should round-trip encrypt and decrypt a message', () => {
            const plaintext = '{"name":"Alice","age":30}';
            const envelope = encryptEnvelope(plaintext, key, 1);
            const decrypted = decryptEnvelope(envelope, key);

            expect(decrypted).toBe(plaintext);
        });

        it('should produce different ciphertext for same plaintext (random IV)', () => {
            const plaintext = 'same-data';
            const env1 = encryptEnvelope(plaintext, key, 1);
            const env2 = encryptEnvelope(plaintext, key, 2);

            expect(env1.data).not.toBe(env2.data);
            expect(env1.iv).not.toBe(env2.iv);
        });

        it('should set the correct sequence number', () => {
            const envelope = encryptEnvelope('test', key, 42);
            expect(envelope.seq).toBe(42);
        });

        it('should fail decryption with wrong key', () => {
            const plaintext = 'secret';
            const envelope = encryptEnvelope(plaintext, key, 1);

            const wrongKey = randomBytes(32);
            expect(() => decryptEnvelope(envelope, wrongKey)).toThrow('Decryption failed');
        });

        it('should fail decryption if data is tampered', () => {
            const plaintext = 'sensitive';
            const envelope = encryptEnvelope(plaintext, key, 1);

            // Tamper with the ciphertext
            const tamperedData = Buffer.from(envelope.data, 'base64url');
            tamperedData[0] = (tamperedData[0]! + 1) % 256;
            const tamperedEnvelope = { ...envelope, data: tamperedData.toString('base64url') };

            expect(() => decryptEnvelope(tamperedEnvelope, key)).toThrow('Decryption failed');
        });

        it('should fail decryption if sequence is tampered (AAD mismatch)', () => {
            const plaintext = 'important';
            const envelope = encryptEnvelope(plaintext, key, 1);

            // Change the sequence number
            const tamperedEnvelope = { ...envelope, seq: 999 };
            expect(() => decryptEnvelope(tamperedEnvelope, key)).toThrow('Decryption failed');
        });

        it('should reject invalid key length', () => {
            expect(() => encryptEnvelope('test', Buffer.alloc(16), 1)).toThrow('Encryption key must be exactly 32 bytes');
            const envelope = encryptEnvelope('test', key, 1);
            expect(() => decryptEnvelope(envelope, Buffer.alloc(16))).toThrow('Encryption key must be exactly 32 bytes');
        });

        it('should handle empty plaintext', () => {
            const envelope = encryptEnvelope('', key, 0);
            const decrypted = decryptEnvelope(envelope, key);
            expect(decrypted).toBe('');
        });

        it('should handle large plaintext', () => {
            const largePlaintext = 'x'.repeat(100_000);
            const envelope = encryptEnvelope(largePlaintext, key, 1);
            const decrypted = decryptEnvelope(envelope, key);
            expect(decrypted).toBe(largePlaintext);
        });

        it('should handle unicode plaintext', () => {
            const plaintext = '{"名前":"太郎","emoji":"🔐"}';
            const envelope = encryptEnvelope(plaintext, key, 1);
            const decrypted = decryptEnvelope(envelope, key);
            expect(decrypted).toBe(plaintext);
        });
    });

    // ─── Serialize / Parse ───────────────────────────────────

    describe('serializeEnvelope / parseEnvelope', () => {
        it('should round-trip serialize and parse', () => {
            const envelope = encryptEnvelope('test data', key, 7);
            const serialized = serializeEnvelope(envelope);
            const parsed = parseEnvelope(serialized);

            expect(parsed.iv).toBe(envelope.iv);
            expect(parsed.tag).toBe(envelope.tag);
            expect(parsed.data).toBe(envelope.data);
            expect(parsed.seq).toBe(envelope.seq);

            // And we can still decrypt after parsing
            const decrypted = decryptEnvelope(parsed, key);
            expect(decrypted).toBe('test data');
        });

        it('should reject invalid JSON', () => {
            expect(() => parseEnvelope('not-json')).toThrow('not valid JSON');
        });

        it('should reject missing fields', () => {
            expect(() => parseEnvelope('{"iv":"a","tag":"b"}')).toThrow('missing required fields');
        });

        it('should reject wrong field types', () => {
            expect(() => parseEnvelope('{"iv":123,"tag":"b","data":"c","seq":1}')).toThrow('iv must be a string');
            expect(() => parseEnvelope('{"iv":"a","tag":"b","data":"c","seq":"notanumber"}')).toThrow('seq must be a number');
        });
    });

    // ─── Full E2EE Round-Trip ────────────────────────────────

    describe('Full E2EE round-trip (ECDH + Envelope)', () => {
        it('should encrypt with server key and decrypt with client-derived key', async () => {
            // Import ECDH functions
            const { generateKeyPair, deriveSharedKeys } = await import('../src/handshake/ecdh.js');

            // Simulate handshake
            const serverKp = generateKeyPair();
            const clientKp = generateKeyPair();

            // Both derive the same shared keys
            const serverKeys = deriveSharedKeys(serverKp.privateKey, clientKp.publicKey);
            const clientKeys = deriveSharedKeys(clientKp.privateKey, serverKp.publicKey);

            // Server encrypts a response
            const responseBody = JSON.stringify({ user: 'Alice', role: 'admin' });
            const envelope = encryptEnvelope(responseBody, serverKeys.encryptionKey, 1);

            // Client decrypts using their derived key
            const decrypted = decryptEnvelope(envelope, clientKeys.encryptionKey);
            expect(decrypted).toBe(responseBody);
            expect(JSON.parse(decrypted)).toEqual({ user: 'Alice', role: 'admin' });
        });
    });
});
