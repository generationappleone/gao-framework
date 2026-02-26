/**
 * @gao/security — Rate Limiter Middleware
 *
 * Configurable rate limiting with support for:
 * - Specific points (requests) per duration
 * - Block duration when limit exceeded
 * - Store adapters (Memory default)
 * - Custom key generation (IP, user ID, route)
 */

import type { GaoContext, Middleware, NextFunction } from '@gao/core';
import { RateLimitError } from '@gao/core';

export interface RateLimiterStore {
  /**
   * Increment the counter for a key and return the new count.
   * Also sets the TTL if it's a new key.
   * Returns current count and milliseconds until reset.
   */
  increment(key: string, durationMs: number): Promise<{ count: number; resetMs: number }>;

  /**
   * Block a key for a specific duration.
   */
  block(key: string, durationMs: number): Promise<void>;

  /**
   * Check if a key is blocked.
   * Returns 0 if not blocked, otherwise milliseconds until unblocked.
   */
  isBlocked(key: string): Promise<number>;
}

export interface RateLimiterOptions {
  /** Number of allowed requests per duration. Default: 60 */
  points?: number;
  /** Duration in seconds before the points reset. Default: 60 (1 minute) */
  duration?: number;
  /** How long to block in seconds when limit exceeded. Default: 0 (no extra block, just wait for reset) */
  blockDuration?: number;
  /** Function to generate a unique key for the request. Default: IP + path */
  keyGenerator?: (ctx: GaoContext) => string | Promise<string>;
  /** The storage adapter to use. Defaults to in-memory store. */
  store?: RateLimiterStore;
  /** Exclude routes or conditions from rate limiting. */
  skip?: (ctx: GaoContext) => boolean | Promise<boolean>;
}

/**
 * Default in-memory store for rate limiting.
 * Cleans up expired entries periodically to prevent memory leaks.
 */
export class MemoryRateLimiterStore implements RateLimiterStore {
  private readonly counts = new Map<string, { count: number; expiresAt: number }>();
  private readonly blocks = new Map<string, number>(); // key -> expiresAt
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  async increment(key: string, durationMs: number): Promise<{ count: number; resetMs: number }> {
    const now = Date.now();
    let entry = this.counts.get(key);

    if (!entry || entry.expiresAt <= now) {
      entry = { count: 0, expiresAt: now + durationMs };
      this.counts.set(key, entry);
    }

    entry.count += 1;
    return { count: entry.count, resetMs: Math.max(0, entry.expiresAt - now) };
  }

  async block(key: string, durationMs: number): Promise<void> {
    this.blocks.set(key, Date.now() + durationMs);
  }

  async isBlocked(key: string): Promise<number> {
    const blockExpiresAt = this.blocks.get(key);
    if (!blockExpiresAt) return 0;

    const now = Date.now();
    if (blockExpiresAt <= now) {
      this.blocks.delete(key);
      return 0;
    }

    return blockExpiresAt - now;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.counts.entries()) {
      if (entry.expiresAt <= now) this.counts.delete(key);
    }
    for (const [key, expiresAt] of this.blocks.entries()) {
      if (expiresAt <= now) this.blocks.delete(key);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.counts.clear();
    this.blocks.clear();
  }
}

/**
 * Default key generator creating a key based on IP.
 */
function defaultKeyGenerator(ctx: GaoContext): string {
  const request = ctx.metadata.request as
    | { ip?: string; method?: string; path?: string }
    | undefined;
  const ip = request?.ip ?? 'unknown-ip';
  const path = request?.path ?? 'unknown-path';
  return `${ip}:${path}`;
}

/**
 * Rate Limiter Middleware.
 */
export function rateLimiter(options: RateLimiterOptions = {}): Middleware {
  const points = options.points ?? 60;
  const durationMs = (options.duration ?? 60) * 1000;
  const blockDurationMs = (options.blockDuration ?? 0) * 1000;
  const store = options.store ?? new MemoryRateLimiterStore();
  const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;

  return {
    name: 'security:rate-limiter',
    handle: async (ctx: GaoContext, next: NextFunction) => {
      if (options.skip && (await options.skip(ctx))) {
        return next();
      }

      const key = await keyGenerator(ctx);

      // 1. Check if blocked
      const blockTimeRemaining = await store.isBlocked(key);
      if (blockTimeRemaining > 0) {
        throw new RateLimitError(
          'Too many requests, blocked.',
          Math.ceil(blockTimeRemaining / 1000),
        );
      }

      // 2. Increment
      const { count, resetMs } = await store.increment(key, durationMs);

      // Add rate limit headers
      let headers = ctx.metadata.responseHeaders as Record<string, string> | undefined;
      if (!headers) {
        headers = {};
        ctx.metadata.responseHeaders = headers;
      }
      headers['X-RateLimit-Limit'] = points.toString();
      headers['X-RateLimit-Remaining'] = Math.max(0, points - count).toString();
      headers['X-RateLimit-Reset'] = Math.ceil(Date.now() / 1000 + resetMs / 1000).toString();

      // 3. Check limit
      if (count > points) {
        if (blockDurationMs > 0) {
          await store.block(key, blockDurationMs);
          throw new RateLimitError(
            'Too many requests, applying penalty block.',
            Math.ceil(blockDurationMs / 1000),
          );
        }
        throw new RateLimitError('Too many requests.', Math.ceil(resetMs / 1000));
      }

      await next();
    },
  };
}
