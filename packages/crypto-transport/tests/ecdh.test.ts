import { describe, expect, it } from 'vitest';
import {
    deriveSharedKeys,
    generateKeyPair,
    encodePublicKey,
    decodePublicKey,
} from '../src/handshake/ecdh.js';

describe('ECDH Key Exchange', () => {
    it('should generate valid X25519 key pairs', () => {
        const kp = generateKeyPair();
        expect(kp.publicKey).toBeInstanceOf(Buffer);
        expect(kp.privateKey).toBeInstanceOf(Buffer);
        expect(kp.publicKey.length).toBe(32);
        expect(kp.privateKey.length).toBe(32);
    });

    it('should generate different key pairs each time', () => {
        const kp1 = generateKeyPair();
        const kp2 = generateKeyPair();
        expect(kp1.publicKey.equals(kp2.publicKey)).toBe(false);
        expect(kp1.privateKey.equals(kp2.privateKey)).toBe(false);
    });

    it('should derive the SAME shared keys from both sides', () => {
        const server = generateKeyPair();
        const client = generateKeyPair();

        // Server derives using client's public key
        const serverKeys = deriveSharedKeys(server.privateKey, client.publicKey);
        // Client derives using server's public key
        const clientKeys = deriveSharedKeys(client.privateKey, server.publicKey);

        // The symmetric keys MUST be identical (ECDH property)
        expect(serverKeys.encryptionKey.equals(clientKeys.encryptionKey)).toBe(true);
        expect(serverKeys.macKey.equals(clientKeys.macKey)).toBe(true);
    });

    it('should derive 32-byte encryption key and 32-byte MAC key', () => {
        const server = generateKeyPair();
        const client = generateKeyPair();
        const keys = deriveSharedKeys(server.privateKey, client.publicKey);

        expect(keys.encryptionKey.length).toBe(32);
        expect(keys.macKey.length).toBe(32);
    });

    it('should produce different keys for different key pairs', () => {
        const server = generateKeyPair();
        const client1 = generateKeyPair();
        const client2 = generateKeyPair();

        const keys1 = deriveSharedKeys(server.privateKey, client1.publicKey);
        const keys2 = deriveSharedKeys(server.privateKey, client2.publicKey);

        expect(keys1.encryptionKey.equals(keys2.encryptionKey)).toBe(false);
    });

    it('should reject invalid key lengths', () => {
        const shortKey = Buffer.alloc(16);
        const validKey = generateKeyPair();

        expect(() => deriveSharedKeys(shortKey, validKey.publicKey)).toThrow('Private key must be exactly 32 bytes');
        expect(() => deriveSharedKeys(validKey.privateKey, shortKey)).toThrow('Public key must be exactly 32 bytes');
    });

    it('should encode/decode public key to/from base64url', () => {
        const kp = generateKeyPair();
        const encoded = encodePublicKey(kp.publicKey);

        // base64url should not contain +, /, or =
        expect(encoded).not.toMatch(/[+/=]/);

        const decoded = decodePublicKey(encoded);
        expect(decoded.equals(kp.publicKey)).toBe(true);
    });

    it('should reject invalid base64url-encoded public key', () => {
        expect(() => decodePublicKey('dG9vc2hvcnQ')).toThrow('Invalid public key length');
    });
});
