import type { GaoContext } from '@gao/core';

// ─── Helmet ──────────────────────────────────────────────────
export interface HelmetOptions {
  /** If true, bypass all default headers and only use provided overrides (default: false) */
  overrideDefaults?: boolean;
  /** Add/override specific headers (e.g., {'X-Custom': 'value', 'Strict-Transport-Security': null to disable}) */
  headers?: Record<string, string | null>;
  /** Content Security Policy directives */
  contentSecurityPolicy?: false | Record<string, string[] | string>;
}

// ─── CORS ────────────────────────────────────────────────────
export type CorsOriginResolver = (
  origin: string | undefined,
  ctx: GaoContext,
) => boolean | Promise<boolean>;

export interface CorsOptions {
  /** Allowed origins. Array of strings, regular expressions, a resolver function, or true for any (not recommended) */
  origin?: readonly string[] | readonly RegExp[] | CorsOriginResolver | boolean;
  /** Allowed methods. Defaults to GET,HEAD,PUT,PATCH,POST,DELETE */
  methods?: readonly string[];
  /** Allowed request headers. Array of strings or '*' */
  allowedHeaders?: readonly string[] | '*';
  /** Exposed response headers. Array of strings */
  exposedHeaders?: readonly string[];
  /** Indicates whether credentials can be shared. Defaults to false. */
  credentials?: boolean;
  /** Max age (in seconds) the results of a preflight request can be cached. Defaults to 24h */
  maxAge?: number;
  /** Allow preflight requests to succeed even if origin is blocked (for error handling by other middleware). Defaults to false */
  optionsSuccessStatus?: number;
}
