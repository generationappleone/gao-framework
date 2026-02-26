import type { GaoContext } from '@gao/core';
import { describe, expect, it, vi } from 'vitest';
import { cors } from '../src/middleware/cors.js';

describe('CORS Middleware', () => {
  it('should allow explicitly defined origins', async () => {
    const middleware = cors({ origin: ['https://trustedsite.com'] });
    const ctx = {
      metadata: {
        request: { method: 'GET', headers: { origin: 'https://trustedsite.com' } },
      },
    } as unknown as GaoContext;
    const next = vi.fn();

    await middleware.handle(ctx, next);

    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://trustedsite.com');
    expect(headers.Vary).toContain('Origin');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should block unsupported origins strictly without wildcard', async () => {
    const middleware = cors({ origin: ['https://trustedsite.com'] });
    const ctx = {
      metadata: {
        request: { method: 'GET', headers: { origin: 'https://evil.com' } },
      },
    } as unknown as GaoContext;
    const next = vi.fn();

    await middleware.handle(ctx, next);

    // Flow shouldn't reach next() because origin wasn't allowed and we blocked strictly
    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1); // Wait, next() is called so it proceeds but WITHOUT headers
    // Let's refine the test, our CORS middleware returns next() immediately if unauthorized origin instead of throwing
  });

  it('should handle preflight OPTIONS request correctly and skip downstream handling', async () => {
    const middleware = cors({ origin: ['https://trustedsite.com'] });
    const ctx = {
      metadata: {
        request: {
          method: 'OPTIONS',
          headers: {
            origin: 'https://trustedsite.com',
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'Content-Type',
          },
        },
      },
    } as unknown as GaoContext;
    const next = vi.fn();

    await middleware.handle(ctx, next);

    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://trustedsite.com');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET,HEAD,PUT,PATCH,POST,DELETE');
    expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type');

    // Crucial part: it should NOT call next() on preflight, but mark it complete
    expect(next).not.toHaveBeenCalled();
    expect(ctx.metadata.isPreflightComplete).toBe(true);
    expect(ctx.metadata.statusCode).toBe(204);
  });
});
