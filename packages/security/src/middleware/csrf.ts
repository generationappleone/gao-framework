/**
 * @gao/security — CSRF Middleware
 *
 * Double Submit Cookie + Synchronizer Token pattern:
 * - Cookie holds the signed secret
 * - Header (X-CSRF-Token) or body field holds the token
 * - Skips safe methods (GET, HEAD, OPTIONS)
 * - Auto-generates token for all requests
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { GaoContext, Middleware, NextFunction } from '@gao/core';
import { ForbiddenError } from '@gao/core';

export interface CsrfOptions {
  /** The secret key used to sign the CSRF cookie/token. MUST be provided. */
  secretKey: string;
  /** Name of the cookie containing the CSRF secret. Default: 'csrf_secret' */
  cookieName?: string;
  /** Name of the header containing the CSRF token. Default: 'x-csrf-token' */
  headerName?: string;
  /** Ignore methods. Default: ['GET', 'HEAD', 'OPTIONS'] */
  ignoreMethods?: readonly string[];
  /** Secure cookie true/false. Set to true in production. Default: false */
  secureCookie?: boolean;
}

/**
 * Generate a cryptographically secure random secret (32 bytes = 64 hex chars).
 */
export function generateCsrfSecret(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates a token from a secret and a signing key.
 * Token format: `salt.hmac(salt + secret + key)`
 */
export function createCsrfToken(secret: string, key: string): string {
  const salt = randomBytes(8).toString('hex');
  const hmac = createHmac('sha256', key);
  hmac.update(`${salt}:${secret}`);
  const signature = hmac.digest('base64url');

  return `${salt}.${signature}`;
}

/**
 * Verifies a token matches the given secret using the signing key.
 */
export function verifyCsrfToken(
  token: string | undefined,
  secret: string | undefined,
  key: string,
): boolean {
  if (!token || !secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [salt, signature] = parts;
  if (!salt || !signature) return false;

  const hmac = createHmac('sha256', key);
  hmac.update(`${salt}:${secret}`);
  const expectedSignature = hmac.digest('base64url');

  try {
    const expectedBuf = Buffer.from(expectedSignature, 'ascii');
    const actualBuf = Buffer.from(signature, 'ascii');

    if (expectedBuf.length !== actualBuf.length) return false;

    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Creates a CSRF protection middleware.
 */
export function csrf(options: CsrfOptions): Middleware {
  if (!options.secretKey) {
    throw new Error('CSRF middleware requires "secretKey" option');
  }

  const cookieName = options.cookieName ?? 'csrf_secret';
  const headerName = (options.headerName ?? 'x-csrf-token').toLowerCase();
  const ignoreMethods = new Set(options.ignoreMethods ?? ['GET', 'HEAD', 'OPTIONS']);
  const secureParams = options.secureCookie
    ? 'Secure; HttpOnly; SameSite=Lax'
    : 'HttpOnly; SameSite=Lax';

  return {
    name: 'security:csrf',
    handle: async (ctx: GaoContext, next: NextFunction) => {
      // Expecting HTTP adapter to pass parsed cookies and headers
      const request = ctx.metadata.request as
        | {
            method: string;
            headers: Record<string, string>;
            cookies: Record<string, string>;
          }
        | undefined;

      let responseHeaders = ctx.metadata.responseHeaders as Record<string, string> | undefined;
      if (!responseHeaders) {
        responseHeaders = {};
        ctx.metadata.responseHeaders = responseHeaders;
      }
      if (!request) return next();

      let secret = request.cookies?.[cookieName];

      // 1. Generate new secret if missing
      if (!secret) {
        secret = generateCsrfSecret();
        const cookieValue = `${cookieName}=${secret}; Path=/; ${secureParams}`;

        // Append cookie header safely
        const setCookie = responseHeaders['Set-Cookie'];
        if (setCookie) {
          responseHeaders['Set-Cookie'] = Array.isArray(setCookie)
            ? [...setCookie, cookieValue].join(', ')
            : `${setCookie}, ${cookieValue}`;
        } else {
          responseHeaders['Set-Cookie'] = cookieValue;
        }
      }

      // Generate a new token for the view layer or frontend to use
      const token = createCsrfToken(secret, options.secretKey);
      ctx.metadata.csrfToken = token;

      // 2. Skip safe methods
      if (ignoreMethods.has(request.method)) {
        return next();
      }

      // 3. Extract submitted token from Header (primary) or Body
      const submittedToken = request.headers[headerName];

      // 4. Validate
      const isValid = verifyCsrfToken(submittedToken, secret, options.secretKey);

      if (!isValid) {
        throw new ForbiddenError('Invalid or missing CSRF token');
      }

      await next();
    },
  };
}
