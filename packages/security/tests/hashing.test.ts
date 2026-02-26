import { describe, expect, it } from 'vitest';
import { hashPassword, needsRehash, verifyPassword } from '../src/crypto/hashing.js';

// Use lighter settings for tests to speed them up
const TEST_OPTIONS = {
  memoryCost: 4096,
  timeCost: 2,
  parallelism: 1,
};

describe('Hashing Service (Argon2)', () => {
  it('should hash a password successfully', async () => {
    const hash = await hashPassword('my-secret-password', TEST_OPTIONS);
    expect(hash).toBeDefined();
    // Default Argon2 format: $argon2id$v=19$m=...,t=...,p=...$salt$hash
    expect(hash.startsWith('$argon2id$v=19$')).toBe(true);
  });

  it('should verify a valid password', async () => {
    const password = 'my-secret-password';
    const hash = await hashPassword(password, TEST_OPTIONS);

    expect(await verifyPassword(hash, password)).toBe(true);
  });

  it('should reject an invalid password', async () => {
    const password = 'my-secret-password';
    const hash = await hashPassword(password, TEST_OPTIONS);

    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });

  it('should reject a malformed hash safely', async () => {
    expect(await verifyPassword('not-a-hash', 'password')).toBe(false);
  });

  it('should detect if a hash needs to be rehashed', async () => {
    const hash = await hashPassword('password', {
      memoryCost: 1024, // low memory cost
      timeCost: 2,
      parallelism: 1,
    });

    // We configured it with low cost. If we check it against our standard test options (4096 memoryCost),
    // it should say yes, needs rehash.
    expect(needsRehash(hash, { ...TEST_OPTIONS, memoryCost: 8192 })).toBe(true);

    // Once hashed with strong options, it shouldn't need a rehash against those same options
    const strongHash = await hashPassword('password', TEST_OPTIONS);
    expect(needsRehash(strongHash, TEST_OPTIONS)).toBe(false);
  });
});
