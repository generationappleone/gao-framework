/**
 * @gao/http — Controller Route Registry
 *
 * Auto-discovery of routes built from decorated classes.
 * Converts Reflect.metadata into usable router configurations.
 * Supports optional DI Container for constructor injection.
 */

import {
  CONTROLLER_METADATA_KEY,
  type ControllerMetadata,
  ROUTES_METADATA_KEY,
  type RouteMetadata,
} from './decorators.js';
import type { MiddlewareHandler } from './middleware.js';
import { getValidationSchema, validateData } from './validation.js';
import type { Container } from '@gao/core';

export interface RouteDefinition {
  method: string;
  path: string;
  controllerName: string;
  handlerName: string;
  middlewares: MiddlewareHandler[];
  handler: (req: any, res: any) => Promise<any>;
}

export class ControllerRegistry {
  private routes: RouteDefinition[] = [];
  private container?: Container;

  /**
   * Optionally set a DI Container for controller resolution.
   */
  public setContainer(container: Container): void {
    this.container = container;
  }

  /**
   * Parse a decorated Controller class and extract routes.
   * If a Container is set, uses container.resolveClass() for DI injection.
   * Otherwise falls back to manual instantiation (backward compatible).
   */
  public register(ControllerClass: new (...args: any[]) => any): void {
    const controllerMeta = Reflect.getMetadata(CONTROLLER_METADATA_KEY, ControllerClass) as
      | ControllerMetadata
      | undefined;

    if (!controllerMeta) {
      throw new Error(`Class ${ControllerClass.name} is not decorated with @Controller`);
    }

    const routesMeta =
      (Reflect.getMetadata(ROUTES_METADATA_KEY, ControllerClass) as RouteMetadata[]) || [];

    // Instantiate via DI Container or manually
    const instance = this.container
      ? this.container.resolveClass(ControllerClass)
      : new ControllerClass();

    for (const route of routesMeta) {
      // Normalize path: handle double slashes
      let fullPath = `${controllerMeta.prefix}${route.path}`.replace(/\/+/g, '/');
      if (fullPath !== '/' && fullPath.endsWith('/')) {
        fullPath = fullPath.slice(0, -1); // remove trailing slash except root
      }

      // Combine controller middlewares with route-specific middlewares
      const combinedMiddlewares = [...controllerMeta.middlewares, ...route.middlewares];

      // Auto-inject validation middleware if @Validate() is present
      const validationSchema = getValidationSchema(instance, route.handlerName);
      if (validationSchema) {
        const validationMw: MiddlewareHandler = async (req, _res, next) => {
          const validated = validateData(validationSchema, req.body);
          req.setValidated(validated);
          return next();
        };
        combinedMiddlewares.push(validationMw);
      }

      this.routes.push({
        method: route.method,
        path: fullPath,
        controllerName: ControllerClass.name,
        handlerName: route.handlerName,
        middlewares: combinedMiddlewares,
        // Create a bound handler to ensure 'this' context works inside the controller
        handler: instance[route.handlerName].bind(instance),
      });
    }
  }

  public getRoutes(): RouteDefinition[] {
    return this.routes;
  }
}
