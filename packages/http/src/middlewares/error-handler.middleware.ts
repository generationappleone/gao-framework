/**
 * @gao/http — Error Handler Middleware
 *
 * Global error handler that wraps the entire pipeline in try-catch.
 * Converts all errors into proper HTTP responses.
 *
 * Should be the OUTERMOST middleware in the pipeline.
 */

import type { MiddlewareHandler } from '../middleware.js';
import { errorHandler } from '../error-handler.js';

/**
 * Error handler middleware — catches all downstream errors.
 */
export function errorHandlerMiddleware(): MiddlewareHandler {
    return async (_req, _res, next) => {
        try {
            return await next();
        } catch (error) {
            return errorHandler(error);
        }
    };
}
