/**
 * @gao/crypto-transport — ECDH Key Exchange
 *
 * X25519 Elliptic Curve Diffie-Hellman key exchange for establishing
 * shared secrets between client and server.
 *
 * Uses Node.js built-in crypto — zero external dependencies.
 *
 * Flow:
 * 1. Both parties generate X25519 key pairs
 * 2. Exchange public keys (via handshake endpoint)
 * 3. Each side derives the same shared secret using ECDH
 * 4. HKDF-SHA256 expands the shared secret into encryption + MAC keys
 */

import {
    diffieHellman,
    generateKeyPairSync,
    createPublicKey,
    createPrivateKey,
    hkdfSync,
} from 'node:crypto';
import type { DerivedKeys, KeyPair } from '../types.js';

/** Info string used in HKDF derivation — binds keys to this protocol version */
const HKDF_INFO = 'gao-e2ee-v1';
/** Length of derived encryption key in bytes (AES-256) */
const ENCRYPTION_KEY_LENGTH = 32;
/** Length of derived MAC key in bytes (HMAC-SHA256) */
const MAC_KEY_LENGTH = 32;
/** Total derived key material length */
const TOTAL_KEY_MATERIAL = ENCRYPTION_KEY_LENGTH + MAC_KEY_LENGTH;

/**
 * Generate a fresh X25519 key pair.
 *
 * @returns A KeyPair with 32-byte raw public and private keys
 */
export function generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = generateKeyPairSync('x25519');

    // Export as raw 32-byte buffers
    const pubRaw = publicKey.export({ type: 'spki', format: 'der' });
    const privRaw = privateKey.export({ type: 'pkcs8', format: 'der' });

    // DER-encoded X25519 public key: the raw 32 bytes are the last 32 bytes
    // DER SPKI for x25519 is 44 bytes: 12-byte header + 32-byte key
    const pubKey = Buffer.from(pubRaw.subarray(pubRaw.length - 32));

    // DER PKCS8 for x25519 is 48 bytes: 16-byte header + 32-byte key
    const privKey = Buffer.from(privRaw.subarray(privRaw.length - 32));

    return {
        publicKey: pubKey,
        privateKey: privKey,
    };
}

/**
 * Convert a raw 32-byte public key back to a KeyObject for crypto operations.
 */
function rawToPublicKeyObject(raw: Buffer) {
    // Build DER SPKI structure for X25519
    // Header: 30 2a 30 05 06 03 2b 65 6e 03 21 00 (12 bytes)
    const header = Buffer.from('302a300506032b656e032100', 'hex');
    const der = Buffer.concat([header, raw]);
    return createPublicKey({ key: der, format: 'der', type: 'spki' });
}

/**
 * Convert a raw 32-byte private key back to a KeyObject for crypto operations.
 */
function rawToPrivateKeyObject(raw: Buffer) {
    // Build DER PKCS8 structure for X25519
    // Header: 30 2e 02 01 00 30 05 06 03 2b 65 6e 04 22 04 20 (16 bytes)
    const header = Buffer.from('302e020100300506032b656e04220420', 'hex');
    const der = Buffer.concat([header, raw]);
    return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
}

/**
 * Compute the shared secret from a local private key and remote public key,
 * then expand it via HKDF-SHA256 into usable encryption and MAC keys.
 *
 * @param localPrivateKey   - 32-byte X25519 raw private key (ours)
 * @param remotePublicKey   - 32-byte X25519 raw public key (theirs)
 * @param salt              - Optional salt for HKDF (default: 32 zero bytes)
 * @returns DerivedKeys (encryptionKey + macKey)
 * @throws Error if key lengths are invalid
 */
export function deriveSharedKeys(
    localPrivateKey: Buffer,
    remotePublicKey: Buffer,
    salt?: Buffer,
): DerivedKeys {
    if (localPrivateKey.length !== 32) {
        throw new Error('Private key must be exactly 32 bytes');
    }
    if (remotePublicKey.length !== 32) {
        throw new Error('Public key must be exactly 32 bytes');
    }

    // Step 1: ECDH — compute raw shared secret
    const privKeyObj = rawToPrivateKeyObject(localPrivateKey);
    const pubKeyObj = rawToPublicKeyObject(remotePublicKey);

    const sharedSecret = diffieHellman({
        privateKey: privKeyObj,
        publicKey: pubKeyObj,
    });

    // Step 2: HKDF-SHA256 — expand shared secret into key material
    const hkdfSalt = salt ?? Buffer.alloc(32, 0);
    const derived = Buffer.from(
        hkdfSync('sha256', sharedSecret, hkdfSalt, HKDF_INFO, TOTAL_KEY_MATERIAL),
    );

    return {
        encryptionKey: derived.subarray(0, ENCRYPTION_KEY_LENGTH),
        macKey: derived.subarray(ENCRYPTION_KEY_LENGTH, TOTAL_KEY_MATERIAL),
    };
}

/**
 * Encode a public key to base64url for safe transmission over HTTP.
 */
export function encodePublicKey(key: Buffer): string {
    return key.toString('base64url');
}

/**
 * Decode a base64url-encoded public key back to a Buffer.
 *
 * @throws Error if decoded key is not exactly 32 bytes
 */
export function decodePublicKey(encoded: string): Buffer {
    const buf = Buffer.from(encoded, 'base64url');
    if (buf.length !== 32) {
        throw new Error(`Invalid public key length: expected 32 bytes, got ${buf.length}`);
    }
    return buf;
}
