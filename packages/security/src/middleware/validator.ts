/**
 * @gao/security — Zod Validator Middleware
 *
 * Auto-validates request body, params, and query against Zod schemas.
 * Returns structured validation errors.
 */

import type { GaoContext, Middleware, NextFunction } from '@gao/core';
import { ValidationError } from '@gao/core';
import { z } from 'zod';

export interface ValidatorOptions<
  Body extends z.ZodTypeAny = z.ZodTypeAny,
  Query extends z.ZodTypeAny = z.ZodTypeAny,
  Params extends z.ZodTypeAny = z.ZodTypeAny,
> {
  body?: Body;
  query?: Query;
  params?: Params;
  /** Drop unrecognized keys from objects. Default true. */
  stripUnknown?: boolean;
}

/**
 * Zod validation middleware wrapper.
 */
export function validate<
  Body extends z.ZodTypeAny,
  Query extends z.ZodTypeAny,
  Params extends z.ZodTypeAny,
>(options: ValidatorOptions<Body, Query, Params>): Middleware {
  const { body, query, params, stripUnknown = true } = options;

  return {
    name: 'security:validator',
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Middleware handle functions are inherently procedural
    handle: async (ctx: GaoContext, next: NextFunction) => {
      // In a real adapter, request object contains these
      const request = ctx.metadata.request as
        | {
            body?: unknown;
            query?: unknown;
            params?: unknown;
          }
        | undefined;

      if (!request) return next();

      const errors: Array<{ field: string; message: string; code: string }> = [];

      // Validate body
      if (body) {
        const result = await body.safeParseAsync(request.body);
        if (!result.success) {
          errors.push(
            ...result.error.issues.map((i) => ({
              field: `body.${i.path.join('.')}`,
              message: i.message,
              code: i.code,
            })),
          );
        } else {
          // Replace with stripped/transformed data
          request.body =
            stripUnknown && body instanceof z.ZodObject
              ? (body as z.AnyZodObject).strip().parse(request.body)
              : result.data;
        }
      }

      // Validate query
      if (query) {
        const result = await query.safeParseAsync(request.query);
        if (!result.success) {
          errors.push(
            ...result.error.issues.map((i) => ({
              field: `query.${i.path.join('.')}`,
              message: i.message,
              code: i.code,
            })),
          );
        } else {
          request.query =
            stripUnknown && query instanceof z.ZodObject
              ? (query as z.AnyZodObject).strip().parse(request.query)
              : result.data;
        }
      }

      // Validate params
      if (params) {
        const result = await params.safeParseAsync(request.params);
        if (!result.success) {
          errors.push(
            ...result.error.issues.map((i) => ({
              field: `params.${i.path.join('.')}`,
              message: i.message,
              code: i.code,
            })),
          );
        } else {
          request.params =
            stripUnknown && params instanceof z.ZodObject
              ? (params as z.AnyZodObject).strip().parse(request.params)
              : result.data;
        }
      }

      if (errors.length > 0) {
        throw new ValidationError('Request validation failed', errors);
      }

      await next();
    },
  };
}
