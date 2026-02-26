import { ForbiddenError } from '@gao/core';
import type { GaoContext } from '@gao/core';
import { describe, expect, it, vi } from 'vitest';
import {
  createCsrfToken,
  csrf,
  generateCsrfSecret,
  verifyCsrfToken,
} from '../src/middleware/csrf.js';

describe('CSRF Middleware helpers', () => {
  it('should generate verify valid tokens', () => {
    const key = 'super-secret-system-key';
    const secret = generateCsrfSecret();

    const token = createCsrfToken(secret, key);
    expect(verifyCsrfToken(token, secret, key)).toBe(true);
  });

  it('should reject tampered tokens', () => {
    const key = 'super-secret-system-key';
    const secret = generateCsrfSecret();

    const token = createCsrfToken(secret, key);
    const tampered = token.replace('.', '.tampered');
    expect(verifyCsrfToken(tampered, secret, key)).toBe(false);
  });
});

describe('CSRF Middleware', () => {
  const secretKey = 'my-app-global-key';

  it('should skip safe methods', async () => {
    const middleware = csrf({ secretKey });
    const next = vi.fn();
    const ctx = {
      metadata: {
        request: { method: 'GET', headers: {}, cookies: {} },
      },
    } as unknown as GaoContext;

    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Should inject token for views
    expect(ctx.metadata.csrfToken).toBeDefined();

    // Should set secret cookie because none existed
    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(headers['Set-Cookie']).toMatch(/csrf_secret=[a-f0-9]+;/);
  });

  it('should reject unsafe method without token', async () => {
    const middleware = csrf({ secretKey });
    const next = vi.fn();
    const secret = generateCsrfSecret();

    const ctx = {
      metadata: {
        request: { method: 'POST', headers: {}, cookies: { csrf_secret: secret } },
      },
    } as unknown as GaoContext;

    await expect(middleware.handle(ctx, next)).rejects.toThrow(ForbiddenError);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow unsafe method with valid token', async () => {
    const middleware = csrf({ secretKey });
    const next = vi.fn();
    const secret = generateCsrfSecret();
    const token = createCsrfToken(secret, secretKey);

    const ctx = {
      metadata: {
        request: {
          method: 'POST',
          headers: { 'x-csrf-token': token },
          cookies: { csrf_secret: secret },
        },
      },
    } as unknown as GaoContext;

    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
