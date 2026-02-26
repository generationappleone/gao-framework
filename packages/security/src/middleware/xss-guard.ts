/**
 * @gao/security — XSS Guard Middleware
 *
 * Protects against Cross-Site Scripting (XSS) attacks:
 * - HTML output encoding via escape helpers
 * - HTML sanitization using DOMPurify (server-side via jsdom)
 * - CSP nonce generation for inline scripts
 * - @SanitizeInput() decorator for model fields
 */

import { randomBytes } from 'node:crypto';
import type { GaoContext, Middleware, NextFunction } from '@gao/core';

// Use JSDOM + DOMPurify for server-side sanitization
interface Sanitizer {
  sanitize(dirty: string, config?: Record<string, unknown>): string;
}

let purifyInstance: Sanitizer | null = null;

async function getSanitizer(): Promise<Sanitizer> {
  if (purifyInstance) return purifyInstance;

  const { JSDOM } = await import('jsdom');
  const dompurifyModule = await import('dompurify');
  const createDOMPurify = dompurifyModule.default;

  const window = new JSDOM('').window;
  purifyInstance = createDOMPurify(window as any) as unknown as Sanitizer;
  return purifyInstance;
}

/**
 * Encode special characters to HTML entities.
 * Prevents XSS in text content (not inside HTML attributes or scripts).
 */
export function htmlEncode(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Server-side HTML sanitization via DOMPurify.
 * Safely strips dangerous tags and attributes.
 */
export async function sanitizeHtml(dirty: string, allowedTags?: string[]): Promise<string> {
  const purify = await getSanitizer();

  const config: Record<string, unknown> = {};
  if (allowedTags) {
    config.ALLOWED_TAGS = allowedTags;
  }

  return purify.sanitize(dirty, config);
}

/**
 * Generate a cryptographically secure nonce for CSP inline scripts.
 * Usage in HTML: <script nonce="VALUE">...</script>
 */
export function generateCspNonce(): string {
  return randomBytes(16).toString('base64url');
}

export interface XssGuardOptions {
  /** If true, sanitize any string fields found in the incoming request body. Default: false */
  sanitizeBody?: boolean;
  /** Allowed HTML tags when sanitizing body (e.g., ['b', 'i', 'p']). Default: [] (no tags allowed) */
  allowedTags?: string[];
  /** If true, generate and attach a CSP nonce to context. Can be used in templates. Default: true */
  injectCspNonce?: boolean;
}

/**
 * XSS Guard middleware.
 * Optionally sanitizes request body and injects a CSP nonce for template use.
 */
export function xssGuard(options: XssGuardOptions = {}): Middleware {
  const { sanitizeBody = false, allowedTags = [], injectCspNonce = true } = options;

  return {
    name: 'security:xss-guard',
    handle: async (ctx: GaoContext, next: NextFunction) => {
      // 1. Generate and inject CSP nonce
      if (injectCspNonce) {
        const nonce = generateCspNonce();
        ctx.metadata.cspNonce = nonce;

        // Update CSP header to include nonce
        const responseHeaders = (ctx.metadata.responseHeaders ??= {}) as Record<string, string>;
        const existingCsp = responseHeaders['Content-Security-Policy'];
        if (existingCsp) {
          responseHeaders['Content-Security-Policy'] = existingCsp.replace(
            "script-src 'self'",
            `script-src 'self' 'nonce-${nonce}'`,
          );
        }
      }

      // 2. Optionally sanitize request body
      if (sanitizeBody) {
        const request = ctx.metadata.request as { body?: unknown } | undefined;
        if (request?.body && typeof request.body === 'object') {
          request.body = await sanitizeObjectStrings(
            request.body as Record<string, unknown>,
            allowedTags,
          );
        }
      }

      await next();
    },
  };
}

/**
 * Recursively sanitize string values in an object.
 */
async function sanitizeObjectStrings(
  obj: Record<string, unknown>,
  allowedTags: string[],
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = await sanitizeHtml(value, allowedTags);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = await sanitizeObjectStrings(value as Record<string, unknown>, allowedTags);
    } else if (Array.isArray(value)) {
      result[key] = await Promise.all(
        value.map((item) =>
          typeof item === 'string'
            ? sanitizeHtml(item, allowedTags)
            : typeof item === 'object' && item !== null
              ? sanitizeObjectStrings(item as Record<string, unknown>, allowedTags)
              : Promise.resolve(item),
        ),
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}
