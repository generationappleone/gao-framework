/**
 * @gao/http — Flash Middleware
 *
 * Ages flash messages on each request (moves current → old, clears current).
 * Attaches `req.flash` helper for flash message management.
 *
 * MUST run AFTER sessionMiddleware (requires req.session).
 */

import type { MiddlewareHandler } from '../middleware.js';
import { FlashMessages } from '../flash.js';

/**
 * Flash middleware — attaches FlashMessages and ages data per request.
 */
export function flashMiddleware(): MiddlewareHandler {
    return async (req, _res, next) => {
        if (req.session) {
            const flash = new FlashMessages(req.session);
            flash.age();
            req.flash = flash;
        }
        return next();
    };
}
