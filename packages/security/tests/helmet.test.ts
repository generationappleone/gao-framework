import type { GaoContext } from '@gao/core';
import { describe, expect, it, vi } from 'vitest';
import { helmet } from '../src/middleware/helmet.js';

describe('Helmet Middleware', () => {
  it('should set default security headers', async () => {
    const middleware = helmet();
    const ctx = { metadata: {} } as unknown as GaoContext;
    const next = vi.fn();

    await middleware.handle(ctx, next);

    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(headers).toBeDefined();
    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-XSS-Protection']).toBe('0');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should override default headers', async () => {
    const middleware = helmet({
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Custom-Header': 'test',
        'X-XSS-Protection': null, // Disable header
      },
    });
    const ctx = { metadata: {} } as unknown as GaoContext;
    const next = vi.fn();

    await middleware.handle(ctx, next);

    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Custom-Header']).toBe('test');
    expect(headers['X-XSS-Protection']).toBeUndefined();
  });

  it('should serialize CSP correctly', async () => {
    const middleware = helmet({
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
      },
    });
    const ctx = { metadata: {} } as unknown as GaoContext;

    await middleware.handle(ctx, vi.fn());

    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(headers['Content-Security-Policy']).toBe("default-src 'self'; img-src 'self' data:");
  });

  it('should bypass defaults if requested', async () => {
    const middleware = helmet({
      overrideDefaults: true,
      headers: { 'X-Strict': 'yes' },
    });
    const ctx = { metadata: {} } as unknown as GaoContext;

    await middleware.handle(ctx, vi.fn());

    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(Object.keys(headers)).toHaveLength(1);
    expect(headers['X-Strict']).toBe('yes');
  });
});
