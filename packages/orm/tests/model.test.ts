import { describe, expect, it } from 'vitest';
import { BaseModel } from '../src/model.js';

class User extends BaseModel {
  declare name: string;
  declare email: string;
}

describe('BaseModel', () => {
  it('should initialize with a UUID', () => {
    const user = new User({});
    expect(user.id).toBeDefined();
    expect(typeof user.id).toBe('string');
    expect(user.id.length).toBe(36); // standard UUID v4 length
  });

  it('should fill attributes', () => {
    const user = new User({ name: 'Alice', email: 'alice@example.com' });
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@example.com');
  });

  it('should track dirty attributes', () => {
    const user = new User({ name: 'Alice' });

    // At initialization, it is synced
    expect(user.isDirty()).toBe(false);

    // Change a value
    user.name = 'Bob';

    expect(user.isDirty()).toBe(true);
    expect(user.isDirty('name')).toBe(true);
    expect(user.isDirty('email')).toBe(false);

    const dirty = user.getDirty();
    expect(dirty).toHaveProperty('name', 'Bob');

    // Sync it
    user.syncOriginal();
    expect(user.isDirty()).toBe(false);
  });

  it('should handle soft deletes', () => {
    const user = new User({ name: 'Alice' });
    expect(user.deleted_at).toBeUndefined();

    user.delete();
    expect(user.deleted_at).toBeDefined();

    user.restore();
    expect(user.deleted_at).toBeUndefined();
  });

  it('should serialize correctly', () => {
    const user = new User({ name: 'Alice', email: 'alice@example.com' });
    const json = user.toJSON();

    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('name', 'Alice');
    expect(json).toHaveProperty('email', 'alice@example.com');
    expect(json).not.toHaveProperty('_originalAttributes');
  });
});
