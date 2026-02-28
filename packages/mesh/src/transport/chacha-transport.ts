/**
 * @gao/mesh — ChaCha20-Poly1305 Transport Encryption
 *
 * Provides authenticated encryption for all inter-node messages.
 * ChaCha20-Poly1305 is chosen for its:
 * - Speed without hardware AES support
 * - Built-in authentication (AEAD)
 * - Resistance to timing attacks
 *
 * Uses Node.js built-in crypto — zero external dependencies.
 */

import * as crypto from 'node:crypto';
import type { EncryptedMeshMessage, MeshMessage } from '../types.js';

const ALGORITHM = 'chacha20-poly1305';
const NONCE_LENGTH = 12; // 96-bit nonce
const TAG_LENGTH = 16;   // 128-bit auth tag
const KEY_LENGTH = 32;   // 256-bit key

/**
 * Encrypt a mesh message using ChaCha20-Poly1305.
 *
 * @param message     - Plaintext mesh message to encrypt
 * @param sessionKey  - 32-byte shared session key
 * @returns Encrypted message ready for wire transmission
 */
export function encryptMessage(
    message: MeshMessage,
    sessionKey: Buffer,
): EncryptedMeshMessage {
    if (sessionKey.length !== KEY_LENGTH) {
        throw new Error(`Session key must be exactly ${KEY_LENGTH} bytes`);
    }

    const nonce = crypto.randomBytes(NONCE_LENGTH);
    const plaintext = Buffer.from(JSON.stringify(message), 'utf8');
    const aad = Buffer.from(message.from, 'utf8');

    // Use low-level encrypt to handle chacha20-poly1305 AEAD properly
    const cipher = (crypto as Record<string, unknown>)['createCipheriv'] as (
        algorithm: string,
        key: Buffer,
        iv: Buffer,
        options: { authTagLength: number },
    ) => crypto.CipherGCM;

    const c = cipher(ALGORITHM, sessionKey, nonce, { authTagLength: TAG_LENGTH });
    c.setAAD(aad);

    const ciphertext = Buffer.concat([c.update(plaintext), c.final()]);
    const tag = c.getAuthTag();

    return {
        from: message.from,
        to: message.to,
        ciphertext,
        nonce,
        tag,
    };
}

/**
 * Decrypt an encrypted mesh message.
 *
 * @param encrypted   - Encrypted mesh message from the wire
 * @param sessionKey  - 32-byte shared session key
 * @returns Decrypted MeshMessage
 * @throws Error on decryption failure (wrong key, tampered data)
 */
export function decryptMessage(
    encrypted: EncryptedMeshMessage,
    sessionKey: Buffer,
): MeshMessage {
    if (sessionKey.length !== KEY_LENGTH) {
        throw new Error(`Session key must be exactly ${KEY_LENGTH} bytes`);
    }

    const decipher = (crypto as Record<string, unknown>)['createDecipheriv'] as (
        algorithm: string,
        key: Buffer,
        iv: Buffer,
        options: { authTagLength: number },
    ) => crypto.DecipherGCM;

    const d = decipher(ALGORITHM, sessionKey, encrypted.nonce, { authTagLength: TAG_LENGTH });
    d.setAuthTag(encrypted.tag);
    d.setAAD(Buffer.from(encrypted.from, 'utf8'));

    try {
        const plaintext = Buffer.concat([d.update(encrypted.ciphertext), d.final()]);
        return JSON.parse(plaintext.toString('utf8')) as MeshMessage;
    } catch {
        throw new Error('Mesh message decryption failed: invalid key or tampered data');
    }
}

/**
 * Serialize a wire-format encrypted message to a binary buffer.
 * Format: [4b from_len][from][4b to_len][to][12b nonce][16b tag][ciphertext]
 */
export function serializeWireMessage(msg: EncryptedMeshMessage): Buffer {
    const from = Buffer.from(msg.from, 'utf8');
    const to = Buffer.from(msg.to, 'utf8');

    const fromLen = Buffer.alloc(4);
    fromLen.writeUInt32BE(from.length);

    const toLen = Buffer.alloc(4);
    toLen.writeUInt32BE(to.length);

    return Buffer.concat([fromLen, from, toLen, to, msg.nonce, msg.tag, msg.ciphertext]);
}

/**
 * Deserialize a wire-format binary buffer into an encrypted message.
 */
export function deserializeWireMessage(data: Buffer): EncryptedMeshMessage {
    let offset = 0;

    const fromLen = data.readUInt32BE(offset); offset += 4;
    const from = data.subarray(offset, offset + fromLen).toString('utf8'); offset += fromLen;

    const toLen = data.readUInt32BE(offset); offset += 4;
    const to = data.subarray(offset, offset + toLen).toString('utf8'); offset += toLen;

    const nonce = Buffer.from(data.subarray(offset, offset + NONCE_LENGTH)); offset += NONCE_LENGTH;
    const tag = Buffer.from(data.subarray(offset, offset + TAG_LENGTH)); offset += TAG_LENGTH;
    const ciphertext = Buffer.from(data.subarray(offset));

    return { from, to, ciphertext, nonce, tag };
}
