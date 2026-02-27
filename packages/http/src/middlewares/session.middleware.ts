/**
 * @gao/http — Session Middleware
 *
 * Loads session from cookie on request, saves on response.
 * Attaches `req.session` for use in handlers.
 */

import type { MiddlewareHandler } from '../middleware.js';
import { SessionManager, type SessionConfig, type Session } from '../session.js';

/**
 * Session middleware — wraps SessionManager lifecycle.
 *
 * Must be added BEFORE route handlers and flash middleware.
 */
export function sessionMiddleware(config: SessionConfig = {}): MiddlewareHandler {
    const manager = new SessionManager(config);

    return async (req, res, next) => {
        // Load or create session from cookie
        const cookieHeader = req.header('cookie');
        const session: Session = await manager.loadSession(cookieHeader);

        // Attach session to request
        req.session = session;

        // Set cookie header on the builder BEFORE downstream executes
        // so that it's included regardless of how the response is built.
        // We pre-set it; after downstream, we update it with the final value.
        const result = await next();

        // Save session and get cookie value
        const setCookie = await manager.saveSession(session);

        // If downstream returned a Response object directly,
        // we need to clone it with the Set-Cookie header appended
        if (result instanceof Response) {
            const newHeaders = new Headers(result.headers);
            newHeaders.set('Set-Cookie', setCookie);
            return new Response(result.body, {
                status: result.status,
                statusText: result.statusText,
                headers: newHeaders,
            });
        }

        // If no response returned yet, set on builder for res.build() fallback
        res.header('Set-Cookie', setCookie);
        return result;
    };
}
