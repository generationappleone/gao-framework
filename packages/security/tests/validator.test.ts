import { ValidationError } from '@gao/core';
import type { GaoContext } from '@gao/core';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../src/middleware/validator.js';

describe('Validator Middleware', () => {
  const schema = z.object({
    username: z.string().min(3),
    age: z.number().int().min(18),
  });

  it('should pass valid request body', async () => {
    const middleware = validate({ body: schema });
    const next = vi.fn();
    const ctx = {
      metadata: { request: { body: { username: 'testuser', age: 25 } } },
    } as unknown as GaoContext;

    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Ensure body wasn't mangled
    expect((ctx.metadata.request as any).body).toEqual({ username: 'testuser', age: 25 });
  });

  it('should strip unknown keys by default', async () => {
    const middleware = validate({ body: schema });
    const next = vi.fn();
    const ctx = {
      metadata: { request: { body: { username: 'testuser', age: 25, malicious: true } } },
    } as unknown as GaoContext;

    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Should strip malicious
    expect((ctx.metadata.request as any).body).toEqual({ username: 'testuser', age: 25 });
  });

  it('should reject invalid body and return ValidationError', async () => {
    const middleware = validate({ body: schema });
    const next = vi.fn();
    const ctx = {
      metadata: { request: { body: { username: 'a', age: 10 } } },
    } as unknown as GaoContext;

    try {
      await middleware.handle(ctx, next);
      expect(true).toBe(false); // Should not reach here
    } catch (err: any) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.statusCode).toBe(422);
      expect(err.errors).toHaveLength(2);
      expect(err.errors[0].field).toBe('body.username');
      expect(err.errors[1].field).toBe('body.age');
    }

    expect(next).not.toHaveBeenCalled();
  });

  it('should validate query params', async () => {
    const middleware = validate({ query: z.object({ page: z.string().transform(Number) }) });
    const next = vi.fn();
    const ctx = {
      metadata: { request: { query: { page: '2' } } },
    } as unknown as GaoContext;

    await middleware.handle(ctx, next);

    // Check if transform works
    expect((ctx.metadata.request as any).query.page).toBe(2);
  });
});
