/**
 * @gao/core — Radix Tree Router
 *
 * High-performance router with:
 * - Radix tree for O(log n) route matching
 * - Static, parametric (:id), and wildcard (*) routes
 * - Method-based routing (GET, POST, PUT, DELETE, etc.)
 * - Route grouping with prefix
 * - Route naming and URL generation
 */

import { NotFoundError } from './errors.js';
import type { HttpMethod, MiddlewareFunction, Route, RouteHandler, RouteMatch } from './types.js';

// ─── Radix Tree Node ─────────────────────────────────────────

interface RadixNode {
  segment: string;
  handlers: Map<HttpMethod, RouteEntry>;
  children: RadixNode[];
  paramName?: string;
  isParam: boolean;
  isWildcard: boolean;
}

interface RouteEntry {
  handler: RouteHandler;
  middlewares: readonly MiddlewareFunction[];
  meta: Record<string, unknown>;
  name?: string;
}

function createNode(segment: string): RadixNode {
  return {
    segment,
    handlers: new Map(),
    children: [],
    isParam: segment.startsWith(':'),
    isWildcard: segment === '*',
    paramName: segment.startsWith(':') ? segment.slice(1) : undefined,
  };
}

// ─── Router ──────────────────────────────────────────────────

export class Router {
  private readonly root: RadixNode = createNode('');
  private readonly namedRoutes = new Map<string, string>();
  private readonly routes: Route[] = [];

  /**
   * Add a route to the router.
   */
  add(
    method: HttpMethod,
    path: string,
    handler: RouteHandler,
    options?: {
      middlewares?: readonly MiddlewareFunction[];
      meta?: Record<string, unknown>;
      name?: string;
    },
  ): void {
    const normalizedPath = this.normalizePath(path);
    const segments = normalizedPath.split('/').filter(Boolean);

    let current = this.root;

    for (const segment of segments) {
      let child = current.children.find((c) => c.segment === segment);
      if (!child) {
        child = createNode(segment);
        // Ensure static routes are matched before param routes
        if (child.isParam || child.isWildcard) {
          current.children.push(child);
        } else {
          current.children.unshift(child);
        }
      }
      current = child;
    }

    const entry: RouteEntry = {
      handler,
      middlewares: options?.middlewares ?? [],
      meta: options?.meta ?? {},
      name: options?.name,
    };

    current.handlers.set(method, entry);

    // Store named route for URL generation
    if (options?.name) {
      this.namedRoutes.set(options.name, normalizedPath);
    }

    // Store route for listing
    this.routes.push({
      method,
      path: normalizedPath,
      handler,
      middlewares: entry.middlewares,
      meta: entry.meta,
    });
  }

  // Convenience methods
  get(
    path: string,
    handler: RouteHandler,
    options?: {
      middlewares?: readonly MiddlewareFunction[];
      meta?: Record<string, unknown>;
      name?: string;
    },
  ): void {
    this.add('GET', path, handler, options);
  }

  post(
    path: string,
    handler: RouteHandler,
    options?: {
      middlewares?: readonly MiddlewareFunction[];
      meta?: Record<string, unknown>;
      name?: string;
    },
  ): void {
    this.add('POST', path, handler, options);
  }

  put(
    path: string,
    handler: RouteHandler,
    options?: {
      middlewares?: readonly MiddlewareFunction[];
      meta?: Record<string, unknown>;
      name?: string;
    },
  ): void {
    this.add('PUT', path, handler, options);
  }

  delete(
    path: string,
    handler: RouteHandler,
    options?: {
      middlewares?: readonly MiddlewareFunction[];
      meta?: Record<string, unknown>;
      name?: string;
    },
  ): void {
    this.add('DELETE', path, handler, options);
  }

  patch(
    path: string,
    handler: RouteHandler,
    options?: {
      middlewares?: readonly MiddlewareFunction[];
      meta?: Record<string, unknown>;
      name?: string;
    },
  ): void {
    this.add('PATCH', path, handler, options);
  }

  /**
   * Create a route group with a common prefix.
   */
  group(prefix: string, callback: (router: Router) => void): void {
    const groupRouter = new Router();
    callback(groupRouter);

    // Merge grouped routes into this router with prefix
    for (const route of groupRouter.routes) {
      const fullPath = this.normalizePath(`${prefix}${route.path}`);
      this.add(route.method, fullPath, route.handler, {
        middlewares: route.middlewares,
        meta: route.meta,
      });
    }
  }

  /**
   * Match a request path against registered routes.
   * @returns RouteMatch or throws NotFoundError
   */
  match(method: HttpMethod, path: string): RouteMatch {
    const normalizedPath = this.normalizePath(path);
    const segments = normalizedPath.split('/').filter(Boolean);
    const params: Record<string, string> = {};

    const entry = this.findNode(this.root, segments, 0, params);

    if (!entry) {
      throw new NotFoundError(`Route not found: ${method} ${path}`);
    }

    const handler = entry.handlers.get(method);
    if (!handler) {
      throw new NotFoundError(`Method ${method} not allowed for ${path}`);
    }

    return {
      handler: handler.handler,
      params,
      middlewares: handler.middlewares,
      meta: handler.meta,
    };
  }

  /**
   * Generate a URL from a named route.
   */
  url(name: string, params?: Record<string, string>): string {
    const pattern = this.namedRoutes.get(name);
    if (!pattern) {
      throw new NotFoundError(`Named route not found: ${name}`);
    }

    if (!params) return pattern;

    let url = pattern;
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    }
    return url;
  }

  /**
   * Get all registered routes (for debugging/listing).
   */
  getRoutes(): readonly Route[] {
    return [...this.routes];
  }

  // ─── Private helpers ─────────────────────────────────────

  private findNode(
    node: RadixNode,
    segments: string[],
    index: number,
    params: Record<string, string>,
  ): RadixNode | undefined {
    if (index === segments.length) {
      return node.handlers.size > 0 ? node : undefined;
    }

    const segment = segments[index];
    if (segment === undefined) return undefined;

    return (
      this.matchStatic(node, segments, index, params, segment) ??
      this.matchParam(node, segments, index, params, segment) ??
      this.matchWildcard(node, segments, index, params)
    );
  }

  private matchStatic(
    node: RadixNode,
    segments: string[],
    index: number,
    params: Record<string, string>,
    segment: string,
  ): RadixNode | undefined {
    for (const child of node.children) {
      if (!child.isParam && !child.isWildcard && child.segment === segment) {
        const result = this.findNode(child, segments, index + 1, params);
        if (result) return result;
      }
    }
    return undefined;
  }

  private matchParam(
    node: RadixNode,
    segments: string[],
    index: number,
    params: Record<string, string>,
    segment: string,
  ): RadixNode | undefined {
    for (const child of node.children) {
      if (child.isParam && child.paramName) {
        params[child.paramName] = segment;
        const result = this.findNode(child, segments, index + 1, params);
        if (result) return result;
        delete params[child.paramName];
      }
    }
    return undefined;
  }

  private matchWildcard(
    node: RadixNode,
    segments: string[],
    index: number,
    params: Record<string, string>,
  ): RadixNode | undefined {
    for (const child of node.children) {
      if (child.isWildcard) {
        params['*'] = segments.slice(index).join('/');
        return child;
      }
    }
    return undefined;
  }

  private normalizePath(path: string): string {
    let normalized = path.startsWith('/') ? path : `/${path}`;
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }
}

/**
 * Create a new Router instance.
 */
export function createRouter(): Router {
  return new Router();
}
