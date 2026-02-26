/**
 * @gao/security — AES-256-GCM Encryption Service
 *
 * Provides authenticated encryption with Associated Data (AEAD) using AES-256-GCM.
 * Safe defaults:
 * - 256-bit key from HKDF (Key Derivation Function) or PBKDF2 if password provided.
 * - 96-bit (12-byte) IV generated per encryption
 * - 128-bit (16-byte) Auth Tag attached to ciphertext
 */

import { createCipheriv, createDecipheriv, hkdfSync, pbkdf2Sync, randomBytes } from 'node:crypto';

// Export constants for potential customization, but strictly default to secure profiles.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits (NIST recommendation for GCM)
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

export interface AesOptions {
  /** A base string password or exact 32-byte key Buffer to derive the encryption key from. */
  key: string | Buffer;
  /** Derivation method to convert string to 32-byte key: 'hkdf' (fast, default) or 'pbkdf2' (slow, user passwords). Ignored if `key` is a Buffer. */
  keyDerivation?: 'hkdf' | 'pbkdf2';
  /** Iterations if keyDerivation is 'pbkdf2'. Default: 100,000 */
  iterations?: number;
  /** Optional associated data to strongly bind to the ciphertext. Must provide identical associatedData during decryption. */
  associatedData?: string | Buffer;
}

/**
 * Derives a 32-byte (256-bit) encryption key from a string or returns the buffer directly.
 */
export function deriveKey(options: AesOptions, salt: Buffer): Buffer {
  if (Buffer.isBuffer(options.key)) {
    if (options.key.length !== 32)
      throw new Error('Encryption key buffer must be exactly 32 bytes for AES-256');
    return options.key;
  }

  const method = options.keyDerivation ?? 'hkdf';

  if (method === 'hkdf') {
    // HKDF is preferred for system keys
    return Buffer.from(hkdfSync('sha256', options.key, salt, Buffer.alloc(0), 32));
  }
  // PBKDF2 is slower, better if key comes directly from user typing a password
  const iterations = options.iterations ?? 100_000;
  return pbkdf2Sync(options.key, salt, iterations, 32, 'sha256');
}

/**
 * Encrypt plaintext data using AES-256-GCM.
 * @returns A base64-encoded string combining salt, IV, auth tag, and ciphertext. Format: `b64(salt).b64(iv).b64(tag).b64(ciphertext)`
 */
export function encrypt(plaintext: string | Buffer, options: AesOptions): string {
  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Get 32-byte key
  const keyBuf = deriveKey(options, salt);

  const cipher = createCipheriv(ALGORITHM, keyBuf, iv);

  // Bind authenticated data if provided
  if (options.associatedData) {
    const authDataBuf = Buffer.isBuffer(options.associatedData)
      ? options.associatedData
      : Buffer.from(options.associatedData, 'utf8');
    cipher.setAAD(authDataBuf);
  }

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf8')),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Return base64 payload: salt.iv.authTag.ciphertext
  return [
    salt.toString('base64url'),
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

/**
 * Decrypt a base64-encoded payload encrypted with AES-256-GCM.
 * Payload format: `b64(salt).b64(iv).b64(tag).b64(ciphertext)`
 * @returns Decrypted string (utf-8). If you need Buffer, adjust logic.
 */
export function decrypt(encryptedPayload: string, options: AesOptions): string {
  const parts = encryptedPayload.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted payload format. Expected salt.iv.tag.ciphertext');
  }

  const rawSalt = parts[0];
  const rawIv = parts[1];
  const rawTag = parts[2];
  const rawCiphertext = parts[3];

  if (!rawSalt || !rawIv || !rawTag || !rawCiphertext) {
    throw new Error('Invalid encrypted payload format. Expected salt.iv.tag.ciphertext');
  }

  const salt = Buffer.from(rawSalt, 'base64url');
  const iv = Buffer.from(rawIv, 'base64url');
  const authTag = Buffer.from(rawTag, 'base64url');
  const ciphertext = Buffer.from(rawCiphertext, 'base64url');

  if (iv.length !== IV_LENGTH) throw new Error('Invalid IV length');
  if (authTag.length !== TAG_LENGTH) throw new Error('Invalid authentication tag length');
  if (salt.length !== SALT_LENGTH) throw new Error('Invalid salt length');

  const keyBuf = deriveKey(options, salt);

  const decipher = createDecipheriv(ALGORITHM, keyBuf, iv);
  decipher.setAuthTag(authTag);

  if (options.associatedData) {
    const authDataBuf = Buffer.isBuffer(options.associatedData)
      ? options.associatedData
      : Buffer.from(options.associatedData, 'utf8');
    decipher.setAAD(authDataBuf);
  }

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    // If authTag fails or data corrupted, crypto throws
    throw new Error('Decryption compromised or incorrect key/auth data.');
  }
}
