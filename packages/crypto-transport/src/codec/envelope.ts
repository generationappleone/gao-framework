/**
 * @gao/crypto-transport — Encrypted Envelope Codec
 *
 * Provides AES-256-GCM encryption/decryption and the envelope format
 * used for encrypted payloads in transit.
 *
 * Envelope format (JSON):
 * {
 *   "iv":   "<12-byte IV, base64url>",
 *   "tag":  "<16-byte auth tag, base64url>",
 *   "data": "<ciphertext, base64url>",
 *   "seq":  <monotonic counter>
 * }
 *
 * Security properties:
 * - AES-256-GCM provides authenticated encryption (confidentiality + integrity)
 * - Random IV per message prevents pattern analysis
 * - Sequence counter prevents replay attacks
 * - Auth tag prevents tampering
 */

import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
} from 'node:crypto';
import type { EncryptedEnvelope } from '../types.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96 bits — NIST recommendation for GCM
const TAG_LENGTH = 16;  // 128 bits

/**
 * Encrypt plaintext using AES-256-GCM and package it into an EncryptedEnvelope.
 *
 * @param plaintext       - UTF-8 string to encrypt (typically JSON-stringified body)
 * @param encryptionKey   - 32-byte AES-256 key
 * @param sequenceNumber  - Monotonic counter for replay prevention
 * @returns EncryptedEnvelope ready for wire transmission
 */
export function encryptEnvelope(
    plaintext: string,
    encryptionKey: Buffer,
    sequenceNumber: number,
): EncryptedEnvelope {
    if (encryptionKey.length !== 32) {
        throw new Error('Encryption key must be exactly 32 bytes');
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, encryptionKey, iv, { authTagLength: TAG_LENGTH });

    // Bind the sequence number as additional authenticated data (AAD)
    // This ensures the seq cannot be tampered with independently
    const aad = Buffer.from(String(sequenceNumber), 'utf8');
    cipher.setAAD(aad);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString('base64url'),
        tag: tag.toString('base64url'),
        data: encrypted.toString('base64url'),
        seq: sequenceNumber,
    };
}

/**
 * Decrypt an EncryptedEnvelope back to plaintext.
 *
 * @param envelope        - The encrypted envelope from the wire
 * @param encryptionKey   - 32-byte AES-256 key (must match the one used for encryption)
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, or invalid envelope)
 */
export function decryptEnvelope(
    envelope: EncryptedEnvelope,
    encryptionKey: Buffer,
): string {
    if (encryptionKey.length !== 32) {
        throw new Error('Encryption key must be exactly 32 bytes');
    }

    const iv = Buffer.from(envelope.iv, 'base64url');
    const tag = Buffer.from(envelope.tag, 'base64url');
    const ciphertext = Buffer.from(envelope.data, 'base64url');

    if (iv.length !== IV_LENGTH) {
        throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }
    if (tag.length !== TAG_LENGTH) {
        throw new Error(`Invalid auth tag length: expected ${TAG_LENGTH}, got ${tag.length}`);
    }

    const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);

    // Verify the AAD (sequence number)
    const aad = Buffer.from(String(envelope.seq), 'utf8');
    decipher.setAAD(aad);

    try {
        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
        return decrypted.toString('utf8');
    } catch {
        throw new Error('Decryption failed: invalid key, tampered data, or corrupted envelope');
    }
}

/**
 * Serialize an EncryptedEnvelope to a JSON string for HTTP body transmission.
 */
export function serializeEnvelope(envelope: EncryptedEnvelope): string {
    return JSON.stringify(envelope);
}

/**
 * Parse a JSON string into an EncryptedEnvelope.
 *
 * @throws Error if the input is not a valid envelope
 */
export function parseEnvelope(raw: string): EncryptedEnvelope {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error('Invalid envelope: not valid JSON');
    }

    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('iv' in parsed) ||
        !('tag' in parsed) ||
        !('data' in parsed) ||
        !('seq' in parsed)
    ) {
        throw new Error('Invalid envelope: missing required fields (iv, tag, data, seq)');
    }

    const envelope = parsed as Record<string, unknown>;

    if (typeof envelope['iv'] !== 'string') throw new Error('Invalid envelope: iv must be a string');
    if (typeof envelope['tag'] !== 'string') throw new Error('Invalid envelope: tag must be a string');
    if (typeof envelope['data'] !== 'string') throw new Error('Invalid envelope: data must be a string');
    if (typeof envelope['seq'] !== 'number') throw new Error('Invalid envelope: seq must be a number');

    return {
        iv: envelope['iv'] as string,
        tag: envelope['tag'] as string,
        data: envelope['data'] as string,
        seq: envelope['seq'] as number,
    };
}
