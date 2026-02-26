import { RateLimitError } from '@gao/core';
import type { GaoContext } from '@gao/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRateLimiterStore, rateLimiter } from '../src/middleware/rate-limiter.js';

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests below limit', async () => {
    const middleware = rateLimiter({ points: 5, duration: 60 });
    const ctx = {
      metadata: { request: { ip: '127.0.0.1', path: '/' } },
    } as unknown as GaoContext;

    for (let i = 0; i < 5; i++) {
      const next = vi.fn();
      await middleware.handle(ctx, next);
      expect(next).toHaveBeenCalledTimes(1);
    }
  });

  it('should block requests above limit and set headers', async () => {
    const middleware = rateLimiter({ points: 2, duration: 60 });
    const ctx = {
      metadata: { request: { ip: '192.168.1.1', path: '/api' } },
    } as unknown as GaoContext;

    // First request
    await middleware.handle(ctx, vi.fn());
    const headers = ctx.metadata.responseHeaders as Record<string, string>;
    expect(headers['X-RateLimit-Remaining']).toBe('1');

    // Second request
    await middleware.handle(ctx, vi.fn());
    expect(headers['X-RateLimit-Remaining']).toBe('0');

    // Third request (blocked)
    const next = vi.fn();
    await expect(middleware.handle(ctx, next)).rejects.toThrow(RateLimitError);
    expect(next).not.toHaveBeenCalled();
  });

  it('should apply penalty block if configured', async () => {
    const middleware = rateLimiter({ points: 1, duration: 60, blockDuration: 120 });
    const ctx = {
      metadata: { request: { ip: '10.0.0.1' } },
    } as unknown as GaoContext;

    // 1. Success
    await middleware.handle(ctx, vi.fn());

    // 2. Trip the limit (causes 120s block)
    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow('penalty block');

    // 3. Fast forward 61s (duration passed, but block 120s still active)
    vi.advanceTimersByTime(61_000);

    // 4. Request still blocked because of blockDuration
    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow('blocked');

    // 5. Fast forward remaining 60s
    vi.advanceTimersByTime(60_000);

    // 6. Block lifted, request succeeds
    const next = vi.fn();
    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
