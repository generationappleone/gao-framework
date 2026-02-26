/**
 * @gao/security — Auth Guard
 *
 * Route-level authentication and authorization guard.
 * Integrates with JwtService and RbacEngine.
 */

import type { GaoContext, Middleware, NextFunction } from '@gao/core';
import { ForbiddenError, UnauthorizedError } from '@gao/core';
import type { JwtService } from './jwt.js';
import type { RbacEngine } from './rbac.js';

export interface AuthGuardOptions {
  /** JWT Service to verify tokens. */
  jwtService: JwtService;
  /** RBAC Engine for permissions. */
  rbac?: RbacEngine;
}

export type GuardType = 'authenticated' | { role: string } | { permission: string };

/**
 * Creates an authentication middleware guard.
 * Usage:
 *   router.get('/admin', guard('authenticated', opts), handler)
 *   router.get('/admin', guard({ role: 'admin' }, opts), handler)
 *   router.get('/admin', guard({ permission: 'users.write' }, opts), handler)
 */
export function guard(guardType: GuardType, options: AuthGuardOptions): Middleware {
  const { jwtService, rbac } = options;

  return {
    name: 'security:auth-guard',
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Middleware handle functions are inherently procedural
    handle: async (ctx: GaoContext, next: NextFunction) => {
      const payload = await verifyRequestTokens(ctx, jwtService);

      // Store user info in context
      ctx.metadata.user = {
        id: payload.sub,
        roles: payload.roles ?? [],
        payload,
      };

      if (guardType === 'authenticated') return next();

      const userRoles = (payload.roles as string[] | undefined) ?? [];

      if (typeof guardType === 'object') {
        if (!rbac) throw new ForbiddenError('RBAC not configured');

        if ('role' in guardType) {
          if (!rbac.hasRole(userRoles, guardType.role)) {
            throw new ForbiddenError(`Required role: ${guardType.role}`);
          }
          return next();
        }

        if ('permission' in guardType) {
          if (!rbac.hasPermission(userRoles, guardType.permission)) {
            throw new ForbiddenError(`Required permission: ${guardType.permission}`);
          }
          return next();
        }
      }

      throw new ForbiddenError('Unknown guard type');
    },
  };
}

async function verifyRequestTokens(
  ctx: GaoContext,
  jwtService: JwtService,
): Promise<Record<string, unknown>> {
  const request = ctx.metadata.request as { headers: Record<string, string> } | undefined;
  if (!request) throw new UnauthorizedError('No request context found');

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);
  try {
    return (await jwtService.verify(token, 'access')) as Record<string, unknown>;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}
