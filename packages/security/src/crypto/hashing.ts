/**
 * @gao/security — Argon2 Hashing Service
 *
 * Secure password hashing using Argon2id.
 * Includes hash(), verify(), and needsRehash() utilities.
 */

import * as argon2 from 'argon2';

export interface HashingOptions {
  /** Memory cost in KB. Default: 65536 (64 MB) */
  memoryCost?: number;
  /** Time cost (iterations). Default: 3 */
  timeCost?: number;
  /** Parallelism (threads). Default: 4 */
  parallelism?: number;
  /** Output hash length in bytes. Default: 32 */
  hashLength?: number;
  /** Argon2 variant. Default: argon2id (recommended) */
  type?: argon2.Options['type'];
}

// OWASP Recommended Defaults for Argon2id (as of 2024)
const DEFAULT_OPTIONS: HashingOptions = {
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
  type: argon2.argon2id, // 2 = argon2id
};

/**
 * Hash a plaintext password securely using Argon2id.
 */
export async function hashPassword(password: string, options?: HashingOptions): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return argon2.hash(password, mergedOptions);
}

/**
 * Verify a plaintext password against an Argon2 hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // Return false on malformed hashes instead of throwing
    return false;
  }
}

/**
 * Check if the hash was generated with the given options (i.e. if it needs an upgrade/rehash).
 */
export function needsRehash(hash: string, options?: HashingOptions): boolean {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options } as argon2.Options;
  return argon2.needsRehash(hash, mergedOptions);
}
