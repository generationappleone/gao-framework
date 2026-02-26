/**
 * @gao/security — Helmet Middleware
 *
 * Sets standard security headers to protect against common attacks:
 * - Content Security Policy (XSS, Clickjacking, Data injection)
 * - Strict Transport Security (HSTS)
 * - X-Frame-Options (Clickjacking)
 * - X-Content-Type-Options (MIME sniffing)
 * - Referrer-Policy
 * - Permissions-Policy
 */

import type { GaoContext, Middleware, NextFunction } from '@gao/core';
import type { HelmetOptions } from '../types.js';

// OWASP Recommended Default Headers
const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https:; upgrade-insecure-requests",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-XSS-Protection': '0',
};

/**
 * Serialize CSP object to a string header value.
 */
function serializeCsp(csp: Record<string, string[] | string>): string {
  return Object.entries(csp)
    .map(([directive, values]) => {
      const valueStr = Array.isArray(values) ? values.join(' ') : values;
      return `${directive} ${valueStr}`;
    })
    .join('; ');
}

/**
 * Creates a Helmet middleware factory.
 */
export function helmet(options: HelmetOptions = {}): Middleware {
  // Pre-calculate the final header map during initialization for O(1) request time
  const finalHeaders = new Map<string, string>();

  // 1. Load defaults (if not overriding completely)
  if (!options.overrideDefaults) {
    for (const [key, value] of Object.entries(DEFAULT_HEADERS)) {
      finalHeaders.set(key, value);
    }
  }

  // 2. Handle CSP custom overrides
  if (options.contentSecurityPolicy === false) {
    finalHeaders.delete('Content-Security-Policy');
  } else if (options.contentSecurityPolicy) {
    finalHeaders.set('Content-Security-Policy', serializeCsp(options.contentSecurityPolicy));
  }

  // 3. Handle specific header overrides
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      if (value === null) {
        finalHeaders.delete(key);
      } else {
        finalHeaders.set(key, value);
      }
    }
  }

  return {
    name: 'security:helmet',
    handle: async (ctx: GaoContext, next: NextFunction) => {
      // Setup response headers to be injected (Assuming Context has a response object mechanism)
      // Since HTTP layer is built in Phase 4, we store headers in metadata to be picked up by the adapter
      if (!ctx.metadata.responseHeaders) {
        ctx.metadata.responseHeaders = {};
      }

      const headers = ctx.metadata.responseHeaders as Record<string, string>;

      for (const [key, value] of finalHeaders.entries()) {
        headers[key] = value;
      }

      await next();
    },
  };
}
