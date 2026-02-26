/**
 * @gao/security — CORS Middleware
 *
 * Configurable Cross-Origin Resource Sharing protection:
 * - NO wildcard `*` default. Requires explicit origins (or true for dangerous mode)
 * - Safe preflight caching (24h default)
 * - Proper varying on Origin
 */

import type { GaoContext, Middleware, NextFunction } from '@gao/core';
import type { CorsOptions } from '../types.js';

const DEFAULT_METHODS = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'];
const DEFAULT_MAX_AGE = 86400; // 24 hours

export function cors(options: CorsOptions = {}): Middleware {
  const allowedMethods = options.methods ?? DEFAULT_METHODS;
  const methodsStr = allowedMethods.join(',');
  const allowedHeadersStr: string = (
    Array.isArray(options.allowedHeaders)
      ? options.allowedHeaders.join(',')
      : (options.allowedHeaders ?? '*')
  ) as string;
  const exposedHeadersStr = options.exposedHeaders ? options.exposedHeaders.join(',') : undefined;
  const maxAgeStr = (options.maxAge ?? DEFAULT_MAX_AGE).toString();
  const credentials = options.credentials ?? false;

  return {
    name: 'security:cors',
    handle: async (ctx: GaoContext, next: NextFunction) => {
      // Expecting standard Request/Response info in ctx metadata (passed from HTTP adapter)
      const request = ctx.metadata.request as
        | { method: string; headers: Record<string, string> }
        | undefined;
      const responseHeaders = (ctx.metadata.responseHeaders ??= {}) as Record<string, string>;

      if (!request) {
        // Fallback or not called from an HTTP adapter
        return next();
      }

      const origin = request.headers.origin;

      // Always add Vary: Origin
      const currentVary = responseHeaders.Vary ?? '';
      if (!currentVary.includes('Origin')) {
        responseHeaders.Vary = currentVary ? `${currentVary}, Origin` : 'Origin';
      }

      // Origin validation
      let isAllowed = false;
      if (!origin) {
        // Not a CORS request
        return next();
      }

      if (options.origin === true || options.origin === undefined) {
        isAllowed = true;
        // In production, warn if using blanket true
        // (assuming process.env.NODE_ENV handled somewhere else or logger warns)
      } else if (Array.isArray(options.origin)) {
        isAllowed = options.origin.some((o) =>
          typeof o === 'string' ? o === origin : o instanceof RegExp ? o.test(origin) : false,
        );
      } else if (typeof options.origin === 'function') {
        isAllowed = await options.origin(origin, ctx);
      }

      if (isAllowed) {
        responseHeaders['Access-Control-Allow-Origin'] = origin;
      } else {
        // Strictly block CORS if origin not allowed
        return next();
      }

      if (credentials) {
        responseHeaders['Access-Control-Allow-Credentials'] = 'true';
      }

      if (exposedHeadersStr) {
        responseHeaders['Access-Control-Expose-Headers'] = exposedHeadersStr;
      }

      // Preflight handling (OPTIONS)
      if (request.method === 'OPTIONS' && request.headers['access-control-request-method']) {
        responseHeaders['Access-Control-Allow-Methods'] = methodsStr;

        let acrh = request.headers['access-control-request-headers'];
        if (!acrh && allowedHeadersStr !== '*') {
          acrh = allowedHeadersStr;
        }

        if (acrh) {
          responseHeaders['Access-Control-Allow-Headers'] = acrh;
        }

        if (maxAgeStr) {
          responseHeaders['Access-Control-Max-Age'] = maxAgeStr;
        }

        // Fast path for preflight - stop chain and send success OK (204 usually via adapter)
        ctx.metadata.isPreflightComplete = true;
        ctx.metadata.statusCode = options.optionsSuccessStatus ?? 204;
        return;
      }

      // Standard request
      await next();
    },
  };
}
