import { describe, expect, it } from 'vitest';
import { SERIALIZE_DECORATOR_KEY, Serialize, sanitizePayload } from '../src/serializer.js';

class UserDto {
  id = 0;
  username = '';
  email = '';
  // password is omitted from DTO intentionally
}

describe('Serializer / DTO', () => {
  it('should attach metadata correctly on methods', () => {
    class MockController {
      @Serialize(UserDto)
      public get() {}
    }

    const meta = Reflect.getMetadata(SERIALIZE_DECORATOR_KEY, MockController.prototype, 'get');
    expect(meta).toBe(UserDto);
  });

  it('should strip sensitive keys automatically even without DtoClass', () => {
    const payload = {
      id: 1,
      password: 'supersecretpassword123',
      token: 'jwt-12345',
      name: 'Alice',
      ApiKey: 'ak-4321', // case insensitive check
    };

    const result = sanitizePayload(payload);

    expect(result.password).toBeUndefined();
    expect(result.token).toBeUndefined();
    expect(result.ApiKey).toBeUndefined(); // It's strictly lowercase in sanitize string match?
    // Let's recheck the implementation of sanitizePayload for toLowerCase matching
    expect(result.name).toBe('Alice');
    expect(result.id).toBe(1);
  });

  it('should restrict to DTO keys and defaults if instance reveals keys', () => {
    const payload = {
      id: 99,
      username: 'bob',
      email: 'bob@example.com',
      adminToken: 'admin123',
      internalMetric: 42,
    };

    const result = sanitizePayload(payload, UserDto);

    // internalMetric should be excluded because it's not in UserDto
    // Wait, since adminToken isn't in sensitive keys, and isn't in userDto, it should be excluded
    expect(result.internalMetric).toBeUndefined();
    expect(result.adminToken).toBeUndefined();
    expect(result.id).toBe(99);
    expect(result.username).toBe('bob');
  });

  it('should handle nested arrays', () => {
    const payload = [
      { id: 1, name: 'A', password: '111' },
      { id: 2, name: 'B', token: '222' },
    ];

    const result = sanitizePayload(payload);

    expect(result).toHaveLength(2);
    expect(result[0].password).toBeUndefined();
    expect(result[1].token).toBeUndefined();
    expect(result[0].id).toBe(1);
  });
});
