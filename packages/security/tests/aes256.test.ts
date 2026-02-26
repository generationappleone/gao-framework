import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../src/crypto/aes256.js';

describe('AES-256-GCM Encryption', () => {
  const passwordKey = 'my-master-password';
  const rawKey = randomBytes(32); // Exact 32 byte key buffer

  it('should encrypt and decrypt a string with string key (HKDF)', () => {
    const plaintext = 'This is a top secret message.';
    const ciphertext = encrypt(plaintext, { key: passwordKey, keyDerivation: 'hkdf' });

    // Structure: salt.iv.tag.ciphertext
    expect(ciphertext.split('.')).toHaveLength(4);

    const decrypted = decrypt(ciphertext, { key: passwordKey, keyDerivation: 'hkdf' });
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt a string with PBKDF2', () => {
    const plaintext = 'PBKDF2 is slow but secure for user passwords.';
    // Low iterations for test speed, prod uses 100k
    const ciphertext = encrypt(plaintext, {
      key: passwordKey,
      keyDerivation: 'pbkdf2',
      iterations: 1000,
    });

    const decrypted = decrypt(ciphertext, {
      key: passwordKey,
      keyDerivation: 'pbkdf2',
      iterations: 1000,
    });
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt with an exact Buffer key', () => {
    const plaintext = 'Buffer keys are fastest.';
    const ciphertext = encrypt(plaintext, { key: rawKey });

    const decrypted = decrypt(ciphertext, { key: rawKey });
    expect(decrypted).toBe(plaintext);
  });

  it('should lock ciphertext to associatedData (AAD)', () => {
    const plaintext = 'Banking account balance: $1,000,000';
    const aad = 'User ID: 12345';

    const ciphertext = encrypt(plaintext, { key: passwordKey, associatedData: aad });

    // Decrypting with correct AAD works
    const decrypted = decrypt(ciphertext, { key: passwordKey, associatedData: aad });
    expect(decrypted).toBe(plaintext);

    // Decrypting with wrong AAD throws
    expect(() => {
      decrypt(ciphertext, { key: passwordKey, associatedData: 'User ID: 666' });
    }).toThrow('Decryption compromised');
  });

  it('should detect and reject tampered ciphertexts', () => {
    const plaintext = 'Original message';
    const ciphertext = encrypt(plaintext, { key: passwordKey });

    const parts = ciphertext.split('.');

    // Tamper the ciphertext portion (last part) by flipping a character in the middle
    const mid = Math.floor(parts[3].length / 2);
    parts[3] =
      parts[3].substring(0, mid) +
      (parts[3][mid] === 'A' ? 'B' : 'A') +
      parts[3].substring(mid + 1);
    const tampered = parts.join('.');

    expect(() => {
      decrypt(tampered, { key: passwordKey });
    }).toThrow('Decryption compromised');
  });

  it('should throw on incorrect key lengths for Buffer', () => {
    const badKey = randomBytes(16); // Only 128-bit
    expect(() => {
      encrypt('data', { key: badKey });
    }).toThrow('Encryption key buffer must be exactly 32 bytes');
  });
});
