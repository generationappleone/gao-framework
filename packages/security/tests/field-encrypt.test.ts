import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  ENCRYPTED_FIELDS_META_KEY,
  Encrypted,
  decryptFields,
  encryptFields,
} from '../src/crypto/field-encrypt.js';

class UserProfile {
  public id: number;

  @Encrypted()
  public ssn: string;

  @Encrypted()
  public creditCard: string;

  public name: string;

  constructor(id: number, ssn: string, creditCard: string, name: string) {
    this.id = id;
    this.ssn = ssn;
    this.creditCard = creditCard;
    this.name = name;
  }
}

describe('Field-Level Encryption', () => {
  const masterKey = randomBytes(32);

  it('should register metadata on the prototype', () => {
    const proto = UserProfile.prototype as any;
    expect(proto[ENCRYPTED_FIELDS_META_KEY]).toBeDefined();
    expect(proto[ENCRYPTED_FIELDS_META_KEY].ssn).toBeDefined();
    expect(proto[ENCRYPTED_FIELDS_META_KEY].creditCard).toBeDefined();
  });

  it('should encrypt fields transparently', () => {
    const user = new UserProfile(1, '123-456-789', '4111-1111-1111-1111', 'John Doe');

    const encryptedUser = encryptFields(user, masterKey);

    // Normal fields stay the same
    expect(encryptedUser.id).toBe(1);
    expect(encryptedUser.name).toBe('John Doe');

    // Encrypted fields are transformed and securely randomized
    expect(encryptedUser.ssn).not.toBe('123-456-789');
    expect(encryptedUser.creditCard).not.toBe('4111-1111-1111-1111');
    expect(encryptedUser.ssn.split('.')).toHaveLength(4); // salt.iv.tag.ciphertext format
  });

  it('should decrypt fields transparently', () => {
    const user = new UserProfile(2, '999-99-9999', '5555-5555-5555-5555', 'Jane Doe');
    const encryptedUser = encryptFields(user, masterKey);

    const decryptedUser = decryptFields(encryptedUser, masterKey);

    expect(decryptedUser.id).toBe(2);
    expect(decryptedUser.name).toBe('Jane Doe');
    expect(decryptedUser.ssn).toBe('999-99-9999');
    expect(decryptedUser.creditCard).toBe('5555-5555-5555-5555');
  });

  it('should skip unannotated classes gracefully', () => {
    class NormalData {
      public info = 'public info';
    }
    const data = new NormalData();
    const result = encryptFields(data, masterKey);
    expect(result.info).toBe('public info');
  });

  it('should throw Error for searchable encryption (Not Implemented)', () => {
    class PatientRecord {
      @Encrypted({ searchable: true })
      public medicalId = 'XYZ-123';
    }

    const record = new PatientRecord();
    expect(() => {
      encryptFields(record, masterKey);
    }).toThrow('Searchable deterministic encryption is not yet implemented');
  });
});
