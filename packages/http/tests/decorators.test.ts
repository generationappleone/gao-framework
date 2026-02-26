import { describe, expect, it } from 'vitest';
import {
  CONTROLLER_METADATA_KEY,
  Controller,
  type ControllerMetadata,
  Get,
  Post,
  ROUTES_METADATA_KEY,
  type RouteMetadata,
} from '../src/decorators.js';
import type { MiddlewareHandler } from '../src/middleware.js';

const mockMiddleware: MiddlewareHandler = async (req, res, next) => next();

@Controller('/api/users', [mockMiddleware])
class UserController {
  @Get()
  index() {}

  @Get('/:id')
  show() {}

  @Post('', [mockMiddleware])
  create() {}
}

describe('HTTP Decorators', () => {
  it('should attach controller metadata correctly', () => {
    const meta: ControllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA_KEY, UserController);

    expect(meta).toBeDefined();
    expect(meta.prefix).toBe('/api/users');
    expect(meta.middlewares).toHaveLength(1);
    expect(meta.middlewares[0]).toBe(mockMiddleware);
  });

  it('should attach routes metadata correctly', () => {
    const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_METADATA_KEY, UserController);

    expect(routes).toBeDefined();
    expect(routes).toHaveLength(3);

    const indexRoute = routes.find((r) => r.handlerName === 'index');
    expect(indexRoute?.method).toBe('GET');
    expect(indexRoute?.path).toBe('');

    const showRoute = routes.find((r) => r.handlerName === 'show');
    expect(showRoute?.method).toBe('GET');
    expect(showRoute?.path).toBe('/:id');

    const createRoute = routes.find((r) => r.handlerName === 'create');
    expect(createRoute?.method).toBe('POST');
    expect(createRoute?.path).toBe('');
    expect(createRoute?.middlewares).toHaveLength(1);
  });
});
