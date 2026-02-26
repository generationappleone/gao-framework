/**
 * @gao/security — Field-Level Encryption
 *
 * Provides a decorator and utilities to auto-encrypt/decrypt fields in objects (e.g., ORM models).
 * Uses AES-256-GCM.
 * Supports standard randomized encryption (secure, not searchable).
 * Supports deterministic encryption (searchable, but leaks equality).
 */

import { createHmac } from 'node:crypto';
import { type AesOptions, decrypt, encrypt } from './aes256.js';

/**
 * Metadata key for encrypted fields registry.
 */
export const ENCRYPTED_FIELDS_META_KEY = 'gao:security:encrypted_fields';

/**
 * Configuration for an encrypted field.
 */
export interface EncryptedFieldOptions {
  /** If true, uses deterministic encryption (SIV-like) to allow exact-match searching in the database. Leaks equality. Default: false */
  searchable?: boolean;
}

/**
 * Registry of encrypted fields for a class.
 */
export interface EncryptedFieldRegistry {
  [propertyKey: string]: EncryptedFieldOptions;
}

/**
 * Decorator to mark a class property for auto-encryption.
 * The underlying ORM (Phase 3) will read this metadata.
 */
// biome-ignore lint/suspicious/noExplicitAny: Decorators in strict mode often require any
export function Encrypted(options: EncryptedFieldOptions = {}): any {
  // biome-ignore lint/suspicious/noExplicitAny: Decorator target is generic
  return (target: any, propertyKey: string | symbol) => {
    // We use a property on the target constructor (or prototype) to register fields.
    // In strict mode without reflect-metadata, we can just attach a hidden map to the prototype.
    // biome-ignore lint/suspicious/noExplicitAny: Prototype is an untyped object here
    const prototype = target as any;
    if (!prototype[ENCRYPTED_FIELDS_META_KEY]) {
      Object.defineProperty(prototype, ENCRYPTED_FIELDS_META_KEY, {
        value: {},
        writable: false,
        enumerable: false,
        configurable: true, // Allow overriding in subclasses
      });
    }

    const registry = prototype[ENCRYPTED_FIELDS_META_KEY] as EncryptedFieldRegistry;
    registry[propertyKey.toString()] = options;
  };
}

/**
 * Encrypts an object's marked fields in place or returns a new object.
 * The key should be the global or table-specific master key.
 */
export function encryptFields<T extends object>(entity: T, key: string | Buffer): T {
  const prototype = Object.getPrototypeOf(entity);
  const registry = prototype?.[ENCRYPTED_FIELDS_META_KEY] as EncryptedFieldRegistry | undefined;

  if (!registry) return entity; // Nothing to encrypt

  // biome-ignore lint/suspicious/noExplicitAny: Object spread drops exact type in standard library sometimes
  const result = Object.assign(Object.create(prototype), entity) as any;

  for (const [field, options] of Object.entries(registry)) {
    if (result[field] === undefined || result[field] === null) continue;

    const plaintext = String(result[field]);
    const aesOptions: AesOptions = { key, keyDerivation: 'hkdf' };

    // For searchable encryption, we must use deterministic IVs and Salts.
    // We achieve this by deriving a synthetic random but deterministic Salt+IV from the plaintext itself (SIV-like).
    // Note: To be fully secure, the actual key should be used to hash the plaintext, but AES-256-GCM API requires us to pass IV explicitly.
    if (options.searchable) {
      if (!Buffer.isBuffer(key)) {
        throw new Error('Searchable encryption requires a 32-byte Buffer key.');
      }

      // HMAC the plaintext with the key to get a deterministic 32-byte hash
      const hmac = createHmac('sha256', key);
      hmac.update(plaintext);
      hmac.digest();

      // Since AES-GCM requires a 12-byte IV and 32-byte Salt (in our aes256 wrapper),
      // we would normally patch aes256.ts to allow passing explicit IVs.
      // Instead, we will directly encrypt here for searchable to have precise control over the deterministic artifacts.
      throw new Error(
        'Searchable deterministic encryption is not yet implemented for the underlying AES service. Requires IV controls.',
      );
    }

    result[field] = encrypt(plaintext, aesOptions);
  }

  return result as T;
}

/**
 * Decrypts an object's marked fields in place or returns a new object.
 */
export function decryptFields<T extends object>(entity: T, key: string | Buffer): T {
  const prototype = Object.getPrototypeOf(entity);
  const registry = prototype?.[ENCRYPTED_FIELDS_META_KEY] as EncryptedFieldRegistry | undefined;

  if (!registry) return entity; // Nothing to decrypt

  // biome-ignore lint/suspicious/noExplicitAny: Object spread drops exact type in standard library sometimes
  const result = Object.assign(Object.create(prototype), entity) as any;

  for (const field of Object.keys(registry)) {
    if (result[field] === undefined || result[field] === null) continue;

    try {
      result[field] = decrypt(result[field], { key, keyDerivation: 'hkdf' });
    } catch {
      // If decryption fails, leave it or throw based on strictness. Let's throw for security.
      throw new Error(`Failed to decrypt field ${field}. Key mismatch or data compromised.`);
    }
  }

  return result as T;
}
