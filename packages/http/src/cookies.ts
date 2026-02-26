/**
 * @gao/http — Cookies utility
 *
 * Secure cookie parser and builder following RFC 6265.
 */

import type { GaoRequest } from './request.js';
import type { GaoResponse } from './response.js';

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Default secure cookie options
 */
const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  secure: true, // HTTPS only
  httpOnly: true, // Prevent XSS
  sameSite: 'Lax', // Prevent CSRF by default
};

/**
 * Parses cookies from a GaoRequest
 */
export function getCookies(req: GaoRequest): Record<string, string> {
  const cookieHeader = req.header('Cookie');
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const index = pair.indexOf('=');
    if (index > -1) {
      const key = pair.substring(0, index).trim();
      let val = pair.substring(index + 1).trim();
      if (val[0] === '"') {
        val = val.slice(1, -1);
      }
      try {
        cookies[key] = decodeURIComponent(val);
      } catch (e) {
        cookies[key] = val;
      }
    }
  }

  return cookies;
}

/**
 * Sets a cookie in GaoResponse
 */
export function setCookie(
  res: GaoResponse,
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options };

  let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (opts.maxAge) {
    cookieStr += `; Max-Age=${Math.floor(opts.maxAge)}`;
  }
  if (opts.expires) {
    cookieStr += `; Expires=${opts.expires.toUTCString()}`;
  }
  if (opts.path) {
    cookieStr += `; Path=${opts.path}`;
  }
  if (opts.domain) {
    cookieStr += `; Domain=${opts.domain}`;
  }
  if (opts.secure) {
    cookieStr += '; Secure';
  }
  if (opts.httpOnly) {
    cookieStr += '; HttpOnly';
  }
  if (opts.sameSite) {
    cookieStr += `; SameSite=${opts.sameSite}`;
  }

  res.appendHeader('Set-Cookie', cookieStr);
}

/**
 * Clears a cookie in GaoResponse
 */
export function clearCookie(
  res: GaoResponse,
  name: string,
  options: Omit<CookieOptions, 'maxAge' | 'expires'> = {},
): void {
  setCookie(res, name, '', { ...options, expires: new Date(0) });
}
