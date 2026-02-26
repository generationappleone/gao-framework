import { describe, expect, it } from 'vitest';
import { ControllerRegistry } from '../src/controller.js';
import { Controller, Get, Post } from '../src/decorators.js';
import type { MiddlewareHandler } from '../src/middleware.js';

const mockMw1: MiddlewareHandler = async (req, res, next) => next();
const mockMw2: MiddlewareHandler = async (req, res, next) => next();

@Controller('/api/v1/auth', [mockMw1])
class AuthController {
  @Post('/login', [mockMw2])
  async login(req: any, res: any) {
    return { token: '123' };
  }

  @Get('/me')
  async me(req: any, res: any) {
    return { user: 'Admin' };
  }
}

describe('ControllerRegistry', () => {
  it('should correctly build route definitions from decorators', () => {
    const registry = new ControllerRegistry();
    registry.register(AuthController);

    const routes = registry.getRoutes();

    expect(routes).toHaveLength(2);

    // Login Route Check
    const loginRoute = routes.find((r) => r.handlerName === 'login');
    expect(loginRoute?.method).toBe('POST');
    expect(loginRoute?.path).toBe('/api/v1/auth/login');
    expect(loginRoute?.middlewares).toEqual([mockMw1, mockMw2]);

    // Me Route Check
    const meRoute = routes.find((r) => r.handlerName === 'me');
    expect(meRoute?.method).toBe('GET');
    expect(meRoute?.path).toBe('/api/v1/auth/me');
    expect(meRoute?.middlewares).toEqual([mockMw1]);
  });

  it('should throw an error if registering a class without @Controller', () => {
    class UndecoratedClass {
      index() {}
    }

    const registry = new ControllerRegistry();

    expect(() => registry.register(UndecoratedClass)).toThrow(/is not decorated with @Controller/);
  });

  it('should bind the handler to the correct instance scope', async () => {
    @Controller('/test')
    class TestController {
      public value = 'Hello';

      @Get('/bind')
      async testBind() {
        return this.value;
      }
    }

    const registry = new ControllerRegistry();
    registry.register(TestController);

    const route = registry.getRoutes()[0];
    expect(route).toBeDefined();

    // Execution of the bound handler should correctly reference `this.value`
    const result = await route!.handler({} as any, {} as any);
    expect(result).toBe('Hello');
  });
});
