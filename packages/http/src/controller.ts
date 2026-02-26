/**
 * @gao/http — Controller Route Registry
 *
 * Auto-discovery of routes built from decorated classes.
 * Converts Reflect.metadata into usable router configurations.
 */

import {
  CONTROLLER_METADATA_KEY,
  type ControllerMetadata,
  ROUTES_METADATA_KEY,
  type RouteMetadata,
} from './decorators.js';
import type { MiddlewareHandler } from './middleware.js';

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

  /**
   * Parse a decorated Controller class and extract routes.
   * Note: A real framework would integrate this with DI, but for now we manually instantiate or pass the class.
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

    // Instantiate controller (Integration with @gao/core Container would happen here)
    const instance = new ControllerClass();

    for (const route of routesMeta) {
      // Normalize path: handle double slashes
      let fullPath = `${controllerMeta.prefix}${route.path}`.replace(/\/+/g, '/');
      if (fullPath !== '/' && fullPath.endsWith('/')) {
        fullPath = fullPath.slice(0, -1); // remove trailing slash except root
      }

      // Combine controller middlewares with route-specific middlewares
      const combinedMiddlewares = [...controllerMeta.middlewares, ...route.middlewares];

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
