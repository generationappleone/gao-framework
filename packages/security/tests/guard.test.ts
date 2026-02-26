import { ForbiddenError, UnauthorizedError } from '@gao/core';
import type { GaoContext } from '@gao/core';
import { describe, expect, it, vi } from 'vitest';
import { guard } from '../src/auth/guard.js';
import { JwtService } from '../src/auth/jwt.js';
import { RbacEngine } from '../src/auth/rbac.js';

describe('Auth Guard', () => {
  const secretKey = new TextEncoder().encode('a-very-long-secret-key-at-least-32-chars');
  const jwtService = new JwtService({ secretKey });
  const rbac = new RbacEngine({
    roles: {
      admin: { permissions: ['*'] },
      viewer: { permissions: ['posts.read'] },
    },
  });

  async function makeCtxWithToken(
    subjectId: string,
    roles: string[],
    token?: string,
  ): Promise<GaoContext> {
    const tokens = await jwtService.generateTokens(subjectId, { roles });
    const authToken = token ?? tokens.accessToken;
    return {
      metadata: {
        request: {
          headers: { authorization: `Bearer ${authToken}` },
        },
      },
    } as unknown as GaoContext;
  }

  it('should allow authenticated users through', async () => {
    const middleware = guard('authenticated', { jwtService });
    const ctx = await makeCtxWithToken('user-1', []);
    const next = vi.fn();

    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect((ctx.metadata.user as any).id).toBe('user-1');
  });

  it('should reject missing token', async () => {
    const middleware = guard('authenticated', { jwtService });
    const ctx = {
      metadata: { request: { headers: {} } },
    } as unknown as GaoContext;

    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow(UnauthorizedError);
  });

  it('should reject invalid token', async () => {
    const middleware = guard('authenticated', { jwtService });
    const ctx = {
      metadata: { request: { headers: { authorization: 'Bearer invalid.token.here' } } },
    } as unknown as GaoContext;

    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow(UnauthorizedError);
  });

  it('should allow user with required role', async () => {
    const middleware = guard({ role: 'admin' }, { jwtService, rbac });
    const ctx = await makeCtxWithToken('user-admin', ['admin']);
    const next = vi.fn();

    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should reject user without required role', async () => {
    const middleware = guard({ role: 'admin' }, { jwtService, rbac });
    const ctx = await makeCtxWithToken('user-viewer', ['viewer']);

    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow(ForbiddenError);
  });

  it('should allow user with required permission', async () => {
    const middleware = guard({ permission: 'posts.read' }, { jwtService, rbac });
    const ctx = await makeCtxWithToken('user-viewer', ['viewer']);
    const next = vi.fn();

    await middleware.handle(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should reject user without required permission', async () => {
    const middleware = guard({ permission: 'posts.delete' }, { jwtService, rbac });
    const ctx = await makeCtxWithToken('user-viewer', ['viewer']);

    await expect(middleware.handle(ctx, vi.fn())).rejects.toThrow(ForbiddenError);
  });
});
