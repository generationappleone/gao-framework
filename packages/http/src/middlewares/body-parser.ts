/**
 * @gao/http — Body Parser Middleware
 *
 * Automatically parses request bodies (JSON, form-encoded, multipart).
 * Attaches the result to `req.body`.
 */

import type { MiddlewareHandler } from '../middleware.js';

export interface BodyParserOptions {
    /** Maximum body size in bytes. Default: 1MB (1_048_576). */
    maxSize?: number;
}

/**
 * Middleware that auto-calls `req.parseBody()` for non-GET/HEAD requests.
 */
export function bodyParserMiddleware(_options: BodyParserOptions = {}): MiddlewareHandler {
    return async (req, _res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            await req.parseBody();
        }
        return next();
    };
}
