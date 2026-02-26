/**
 * @gao/security — DDoS Shield Middleware
 *
 * Multi-layer DDoS protection on top of the rate limiter:
 * - Maximum concurrent connections per IP
 * - IP blocklist / allowlist
 * - Request flood detection (spike threshold)
 * - Auto-ban with configurable cooldown
 * - Slowloris timeout protection (via request timeout)
 */

import type { GaoContext, Middleware, NextFunction } from '@gao/core';
import { ForbiddenError, RateLimitError } from '@gao/core';

export interface DdosShieldOptions {
  /** Max concurrent in-flight requests per IP. Default: 50 */
  maxConcurrent?: number;
  /** Burst limit: max requests per second per IP before triggering auto-ban. Default: 30 */
  burstLimit?: number;
  /** Auto-ban duration in seconds when burst limit exceeded. Default: 300 (5 minutes) */
  banDurationSeconds?: number;
  /** IP allowlist — these IPs bypass all checks (e.g., health check IPs). */
  allowlist?: string[];
  /** IP blocklist — these IPs are always rejected. */
  blocklist?: string[];
  /** Function to extract request IP from context. Default: reads from ctx.metadata.request.ip */
  getIp?: (ctx: GaoContext) => string;
}

interface IpState {
  concurrent: number;
  burstCount: number;
  burstWindowStart: number;
  bannedUntil: number;
}

/**
 * DDoS Shield
 */
export function ddosShield(options: DdosShieldOptions = {}): Middleware {
  const maxConcurrent = options.maxConcurrent ?? 50;
  const burstLimit = options.burstLimit ?? 30;
  const banDuration = (options.banDurationSeconds ?? 300) * 1000;
  const allowlist = new Set(options.allowlist ?? []);
  const blocklist = new Set(options.blocklist ?? []);
  const getIp = options.getIp ?? defaultGetIp;

  const ipStates = new Map<string, IpState>();

  // Cleanup stale entries every minute
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, state] of ipStates.entries()) {
      if (
        state.concurrent === 0 &&
        state.bannedUntil < now &&
        state.burstWindowStart < now - 120_000
      ) {
        ipStates.delete(ip);
      }
    }
  }, 60_000);

  if (cleanupInterval.unref) cleanupInterval.unref();

  return {
    name: 'security:ddos-shield',
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Middleware handle functions are inherently procedural
    handle: async (ctx: GaoContext, next: NextFunction) => {
      const ip = getIp(ctx);

      // 1. Allowlist — fast path
      if (allowlist.has(ip)) {
        return next();
      }

      // 2. Blocklist — permanent block
      if (blocklist.has(ip)) {
        throw new ForbiddenError('IP is permanently blocked');
      }

      const now = Date.now();
      let state = ipStates.get(ip);

      if (!state) {
        state = { concurrent: 0, burstCount: 0, burstWindowStart: now, bannedUntil: 0 };
        ipStates.set(ip, state);
      }

      // 3. Check auto-ban
      if (state.bannedUntil > now) {
        const retryAfterSec = Math.ceil((state.bannedUntil - now) / 1000);
        throw new RateLimitError('IP temporarily banned due to flood detection', retryAfterSec);
      }

      // 4. Concurrent connection limit
      if (state.concurrent >= maxConcurrent) {
        throw new RateLimitError(
          `Too many concurrent connections from your IP (max: ${maxConcurrent})`,
          1,
        );
      }

      // 5. Burst detection (requests per second)
      if (now - state.burstWindowStart > 1000) {
        // Reset 1-second window
        state.burstWindowStart = now;
        state.burstCount = 0;
      }

      state.burstCount += 1;

      if (state.burstCount > burstLimit) {
        state.bannedUntil = now + banDuration;
        throw new RateLimitError(
          `Flood detected. IP banned for ${options.banDurationSeconds ?? 300} seconds.`,
          options.banDurationSeconds ?? 300,
        );
      }

      // 6. Track concurrent request in flight
      state.concurrent += 1;

      try {
        await next();
      } finally {
        state.concurrent -= 1;
      }
    },
  };
}

function defaultGetIp(ctx: GaoContext): string {
  const request = ctx.metadata.request as { ip?: string } | undefined;
  return request?.ip ?? 'unknown';
}
