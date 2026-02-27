/**
 * @gao/http — HTTP Handler Factory
 *
 * The main entry point for creating an HTTP request handler with
 * fully wired middleware pipeline, controller DI, and auto-validation.
 */

import type { Container } from '@gao/core';
import { GaoRequest } from './request.js';
import { GaoResponse } from './response.js';
import { MiddlewarePipeline, type MiddlewareHandler } from './middleware.js';
import { ControllerRegistry, type RouteDefinition } from './controller.js';
import type { FetchHandler } from './server.js';

export interface HttpHandlerOptions {
    /** Controller classes to register */
    controllers?: Array<new (...args: any[]) => any>;
    /** Global middlewares (applied to all routes, in order) */
    middlewares?: MiddlewareHandler[];
    /** DI Container for controller resolution */
    container?: Container;
}

/**
 * Creates a FetchHandler with fully wired middleware pipeline.
 *
 * Usage:
 * ```ts
 * const handler = createHttpHandler({
 *   container: app.container,
 *   controllers: [UserController, ContactController],
 *   middlewares: [
 *     errorHandlerMiddleware(),
 *     corsMiddleware({ origin: '*' }),
 *     bodyParserMiddleware(),
 *     sessionMiddleware({ store }),
 *     flashMiddleware(),
 *   ],
 * });
 *
 * const server = new Server(handler, { port: 3000 });
 * await server.listen();
 * ```
 */
export function createHttpHandler(options: HttpHandlerOptions = {}): FetchHandler {
    // Set up controller registry with optional DI
    const registry = new ControllerRegistry();
    if (options.container) {
        registry.setContainer(options.container);
    }

    // Register all controllers
    for (const ControllerClass of options.controllers ?? []) {
        registry.register(ControllerClass);
    }

    const routes = registry.getRoutes();

    // Build the main handler
    const handler: FetchHandler = async (req: GaoRequest, res: GaoResponse): Promise<Response> => {
        // Build pipeline with global middlewares
        const pipeline = new MiddlewarePipeline();

        for (const mw of options.middlewares ?? []) {
            pipeline.use(mw);
        }

        // Execute through the pipeline, with route matching as the final handler
        return pipeline.execute(req, res, async (pReq, pRes) => {
            const matched = matchRoute(routes, pReq);
            if (!matched) {
                return pRes.error(404, 'NOT_FOUND', `Route ${pReq.method} ${pReq.url.pathname} not found`);
            }

            // Extract route params
            const params = extractParams(matched.path, pReq.url.pathname);
            pReq.params = params as any;

            // Execute route-level middlewares
            if (matched.middlewares.length > 0) {
                const routePipeline = new MiddlewarePipeline();
                for (const mw of matched.middlewares) {
                    routePipeline.use(mw);
                }
                return routePipeline.execute(pReq, pRes, matched.handler);
            }

            return matched.handler(pReq, pRes);
        });
    };

    return handler;
}

/**
 * Match a request to a route definition.
 */
function matchRoute(routes: RouteDefinition[], req: GaoRequest): RouteDefinition | undefined {
    const pathname = req.url.pathname;
    const method = req.method;

    for (const route of routes) {
        if (route.method !== method) continue;

        if (routeMatches(route.path, pathname)) {
            return route;
        }
    }

    return undefined;
}

/**
 * Check if a route pattern matches a pathname.
 * Supports static segments and :param segments.
 */
function routeMatches(pattern: string, pathname: string): boolean {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
        const pp = patternParts[i]!;
        if (pp.startsWith(':')) continue; // param segment always matches
        if (pp !== pathParts[i]) return false;
    }

    return true;
}

/**
 * Extract param values from a matched route.
 */
function extractParams(pattern: string, pathname: string): Record<string, string> {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
        const pp = patternParts[i]!;
        if (pp.startsWith(':')) {
            params[pp.slice(1)] = pathParts[i]!;
        }
    }

    return params;
}
