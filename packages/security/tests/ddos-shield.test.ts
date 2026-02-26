import { ForbiddenError, RateLimitError } from '@gao/core';
import type { GaoContext } from '@gao/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ddosShield } from '../src/middleware/ddos-shield.js';

function makeCtx(ip: string): GaoContext {
  return {
    metadata: {
      request: { ip },
    },
  } as unknown as GaoContext;
}

describe('DDoS Shield Middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow whitelisted IPs unconditionally', async () => {
    const middleware = ddosShield({
      allowlist: ['10.0.0.1'],
      burstLimit: 0, // Would block everyone else
    });

    const next = vi.fn();
    await middleware.handle(makeCtx('10.0.0.1'), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should permanently block blacklisted IPs', async () => {
    const middleware = ddosShield({ blocklist: ['192.168.0.100'] });

    await expect(middleware.handle(makeCtx('192.168.0.100'), vi.fn())).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('should track concurrent connections and reject when limit exceeded', async () => {
    const middleware = ddosShield({ maxConcurrent: 2, burstLimit: 100 });
    const ctx = makeCtx('10.1.1.1');

    // Simulate 2 concurrent in-flight requests (don't await next)
    let resolveReq1: () => void;
    let resolveReq2: () => void;

    const req1 = middleware.handle(
      ctx,
      () =>
        new Promise<void>((r) => {
          resolveReq1 = r;
        }),
    );
    const req2 = middleware.handle(
      ctx,
      () =>
        new Promise<void>((r) => {
          resolveReq2 = r;
        }),
    );

    // 3rd request should fail
    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow(RateLimitError);

    // Resolve requests
    resolveReq1?.();
    resolveReq2?.();
    await req1;
    await req2;
  });

  it('should auto-ban IPs that exceed burst limit', async () => {
    const middleware = ddosShield({ burstLimit: 3, banDurationSeconds: 10 });
    const ctx = makeCtx('172.16.0.1');

    // 3 requests are fine
    for (let i = 0; i < 3; i++) {
      await middleware.handle(ctx, vi.fn());
    }

    // 4th request triggers ban
    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow('Flood detected');

    // Immediately after ban, also rejected
    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow('temporarily banned');

    // Advance time past ban period
    vi.advanceTimersByTime(11_000);

    // Now allowed again
    const next = vi.fn();
    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
