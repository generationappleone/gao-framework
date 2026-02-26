/**
 * @gao/http — HTTP Decorators
 *
 * Provides routing metadata using `Reflect.metadata`.
 */

import 'reflect-metadata';
import type { MiddlewareHandler } from './middleware.js';

export const CONTROLLER_METADATA_KEY = Symbol('gao:http:controller');
export const ROUTES_METADATA_KEY = Symbol('gao:http:routes');

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  handlerName: string;
  middlewares: MiddlewareHandler[];
}

export interface ControllerMetadata {
  prefix: string;
  middlewares: MiddlewareHandler[];
}

/**
 * Decorator to define a controller class and its route prefix.
 */
export function Controller(prefix = '', middlewares: MiddlewareHandler[] = []) {
  return (target: new (...args: any[]) => any) => {
    const metadata: ControllerMetadata = {
      prefix,
      middlewares,
    };
    Reflect.defineMetadata(CONTROLLER_METADATA_KEY, metadata, target);
  };
}

/**
 * Factory for creating method-level routing decorators.
 */
function createRouteDecorator(method: HttpMethod) {
  return (path = '', middlewares: MiddlewareHandler[] = []): any =>
    (targetOrValue: any, propertyKeyOrContext: any, descriptor?: PropertyDescriptor) => {
      // Support both experimentalDecorators and Stage 3 decorators
      let target: any;
      let propertyKey: string;

      if (typeof propertyKeyOrContext === 'string' || typeof propertyKeyOrContext === 'symbol') {
        target = targetOrValue;
        propertyKey = String(propertyKeyOrContext);
      } else {
        // Stage 3 decorators
        target = targetOrValue; // targetOrValue is the class itself
        propertyKey = String(propertyKeyOrContext.name);
      }

      // For experimental decorators, target is the prototype for methods.
      // For Stage 3, targetOrValue is the class constructor.
      // We need the constructor for metadata storage.
      const targetObj =
        typeof target === 'function' && target.prototype
          ? target.prototype.constructor
          : targetOrValue.constructor || targetOrValue;

      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_METADATA_KEY, targetObj) || [];
      const tempMws: MiddlewareHandler[] =
        Reflect.getMetadata('gao:http:temp_middlewares', targetObj, propertyKey) || [];

      // If route already exists (e.g., duplicated or added by UseMiddleware logic earlier), find it
      const existing = routes.find((r) => r.handlerName === propertyKey);
      if (existing) {
        existing.method = method;
        existing.path = path;
        existing.middlewares.unshift(...middlewares);
        existing.middlewares.push(...tempMws);
      } else {
        routes.push({
          method,
          path,
          handlerName: propertyKey,
          middlewares: [...middlewares, ...tempMws],
        });
      }

      Reflect.defineMetadata(ROUTES_METADATA_KEY, routes, targetObj);
      return descriptor || targetOrValue; // Return descriptor for experimental, or targetOrValue for Stage 3 (class decorator context)
    };
}

export const Get = createRouteDecorator('GET');
export const Post = createRouteDecorator('POST');
export const Put = createRouteDecorator('PUT');
export const Delete = createRouteDecorator('DELETE');
export const Patch = createRouteDecorator('PATCH');

export function UseMiddleware(...middlewares: MiddlewareHandler[]) {
  return (targetOrValue: any, propertyKeyOrContext?: any, descriptor?: PropertyDescriptor) => {
    let target: any;
    let propertyKey: string | undefined;

    if (typeof propertyKeyOrContext === 'string' || typeof propertyKeyOrContext === 'symbol') {
      target = targetOrValue;
      propertyKey = String(propertyKeyOrContext);
    } else if (propertyKeyOrContext) {
      target = targetOrValue;
      propertyKey = String(propertyKeyOrContext.name);
    } else {
      target = targetOrValue;
    }

    const targetObj =
      typeof target === 'function' && target.prototype
        ? target.prototype.constructor
        : target.constructor || target;

    if (propertyKey) {
      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_METADATA_KEY, targetObj) || [];
      const route = routes.find((r) => r.handlerName === propertyKey);
      if (route) {
        route.middlewares.push(...middlewares);
      } else {
        // If route isn't defined yet, this decorator ran before @Get etc.
        // In experimental decorators, method decorators run bottom-up, so @UseMiddleware
        // might run before or after depending on order. Let's save it.
        const tempMws =
          Reflect.getMetadata('gao:http:temp_middlewares', targetObj, propertyKey) || [];
        tempMws.push(...middlewares);
        Reflect.defineMetadata('gao:http:temp_middlewares', tempMws, targetObj, propertyKey);
      }
    } else {
      // Apply to controller
      const meta: ControllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA_KEY, target) || {
        prefix: '',
        middlewares: [],
      };
      meta.middlewares.push(...middlewares);
      Reflect.defineMetadata(CONTROLLER_METADATA_KEY, meta, target);
    }

    return descriptor || targetOrValue;
  };
}
