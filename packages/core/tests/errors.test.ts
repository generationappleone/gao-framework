import { describe, expect, it } from 'vitest';
import { GaoError, NotFoundError, RateLimitError, ValidationError } from '../src/errors.js';

describe('Error System', () => {
  it('should instantiate NotFoundError correctly', () => {
    const err = new NotFoundError('User not found');
    expect(err).toBeInstanceOf(GaoError);
    expect(err.name).toBe('NotFoundError');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('User not found');
  });

  it('should serialize to JSON correctly', () => {
    const err = new ValidationError('Invalid input', [
      { field: 'email', message: 'Invalid email', code: 'INVALID_EMAIL' },
    ]);
    const json = err.toJSON();
    expect(json.name).toBe('ValidationError');
    expect(json.code).toBe('VALIDATION_ERROR');
    expect(json.statusCode).toBe(422);
    expect(json.metadata).toEqual({
      errors: [{ field: 'email', message: 'Invalid email', code: 'INVALID_EMAIL' }],
    });
    expect(json.timestamp).toBeDefined();
  });

  it('should support correlationId', () => {
    const err = new RateLimitError('Too many requests', 60, { correlationId: 'req-123' });
    expect(err.correlationId).toBe('req-123');
    expect(err.toJSON().correlationId).toBe('req-123');
  });
});
