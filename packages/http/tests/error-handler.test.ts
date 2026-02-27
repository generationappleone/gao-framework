import { NotFoundError, ValidationError } from '@gao/core';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../src/error-handler.js';

describe('Global Error Handler', () => {
  it('should map ValidationError to 422 with details', async () => {
    const err = new ValidationError('Validation failed', [
      { field: 'email', message: 'Invalid email', code: 'invalid' },
    ]);
    const res = errorHandler(err);

    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: [{ field: 'email', message: 'Invalid email', code: 'invalid' }],
    });
  });

  it('should map NotFoundError to 404', async () => {
    const err = new NotFoundError('User not found');
    const res = errorHandler(err);

    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('should map standard node Error to 500', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const err = new Error('Database connection failed');
    const res = errorHandler(err);

    expect(res.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();

    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).toBe('Database connection failed');

    consoleSpy.mockRestore();
  });

  it('should handle thrown strings', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const res = errorHandler('just a string error');

    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');

    consoleSpy.mockRestore();
  });
});
