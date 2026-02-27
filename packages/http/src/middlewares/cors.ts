/**
 * @gao/http — CORS Middleware
 *
 * Cross-Origin Resource Sharing middleware with configurable origins,
 * methods, headers, and preflight handling.
 */

import type { MiddlewareHandler } from '../middleware.js';

export interface CorsOptions {
    /** Allowed origins. Use '*' for any (not recommended in production). Default: [] (none). */
    origin?: string | string[] | ((origin: string) => boolean);
    /** Allowed HTTP methods. Default: ['GET','HEAD','PUT','PATCH','POST','DELETE']. */
    methods?: string[];
    /** Allowed headers. Default: ['Content-Type','Authorization','X-Correlation-ID']. */
    allowedHeaders?: string[];
    /** Exposed headers to the client. */
    exposedHeaders?: string[];
    /** Allow credentials (cookies, auth headers). Default: false. */
    credentials?: boolean;
    /** Preflight max age in seconds. Default: 86400 (24h). */
    maxAge?: number;
}

/**
 * CORS middleware — sets CORS headers and handles OPTIONS preflight.
 */
export function corsMiddleware(options: CorsOptions = {}): MiddlewareHandler {
    const methods = options.methods ?? ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'];
    const allowedHeaders = options.allowedHeaders ?? ['Content-Type', 'Authorization', 'X-Correlation-ID'];
    const maxAge = options.maxAge ?? 86400;
    const credentials = options.credentials ?? false;

    function resolveOrigin(requestOrigin: string | null): string | null {
        if (!requestOrigin) return null;

        const opt = options.origin;
        if (!opt) return null;
        if (opt === '*') return '*';
        if (typeof opt === 'string') return opt === requestOrigin ? opt : null;
        if (typeof opt === 'function') return opt(requestOrigin) ? requestOrigin : null;
        if (Array.isArray(opt)) return opt.includes(requestOrigin) ? requestOrigin : null;
        return null;
    }

    function buildCorsHeaders(requestOrigin: string | null): Record<string, string> {
        const headers: Record<string, string> = {};
        const allowedOrigin = resolveOrigin(requestOrigin);

        if (allowedOrigin) {
            headers['Access-Control-Allow-Origin'] = allowedOrigin;
            if (allowedOrigin !== '*') {
                headers['Vary'] = 'Origin';
            }
        }

        if (credentials) {
            headers['Access-Control-Allow-Credentials'] = 'true';
        }

        if (options.exposedHeaders?.length) {
            headers['Access-Control-Expose-Headers'] = options.exposedHeaders.join(', ');
        }

        return headers;
    }

    return async (req, res, next) => {
        const requestOrigin = req.header('origin');
        const corsHeaders = buildCorsHeaders(requestOrigin);

        // Handle preflight OPTIONS requests
        if (req.method === 'OPTIONS') {
            for (const [key, value] of Object.entries(corsHeaders)) {
                res.header(key, value);
            }
            res.header('Access-Control-Allow-Methods', methods.join(', '));
            res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
            res.header('Access-Control-Max-Age', String(maxAge));

            return res.status(204).build();
        }

        // For non-preflight: execute downstream, then append CORS headers
        const result = await next();

        if (result instanceof Response) {
            const newHeaders = new Headers(result.headers);
            for (const [key, value] of Object.entries(corsHeaders)) {
                newHeaders.set(key, value);
            }
            return new Response(result.body, {
                status: result.status,
                statusText: result.statusText,
                headers: newHeaders,
            });
        }

        // Fallback: set on builder
        for (const [key, value] of Object.entries(corsHeaders)) {
            res.header(key, value);
        }
        return result;
    };
}
