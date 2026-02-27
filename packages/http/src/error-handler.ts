/**
 * @gao/http — Error Handler & HTTP Exceptions
 *
 * Maps exceptions to HTTP responses with proper status codes.
 * Includes a dev-mode error page and production-safe error masking.
 */

import { ValidationError, isGaoError, getCorrelationId } from '@gao/core';
import { GaoResponse } from './response.js';
import { HttpValidationError } from './validation.js';

// ─── HTTP Exception Classes ────────────────────────────────────

export class HttpException extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpException';
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundException';
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
    this.name = 'BadRequestException';
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenException';
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Resource conflict') {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictException';
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message = 'Unprocessable entity', details?: unknown) {
    super(422, 'UNPROCESSABLE_ENTITY', message, details);
    this.name = 'UnprocessableEntityException';
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(message = 'Too many requests', public readonly retryAfter?: number) {
    super(429, 'TOO_MANY_REQUESTS', message);
    this.name = 'TooManyRequestsException';
  }
}

// ─── Error Handler ─────────────────────────────────────────────

export function errorHandler(error: unknown): Response {
  const res = new GaoResponse();
  const correlationId = getCorrelationId();
  const isDev = process.env.NODE_ENV !== 'production';

  // HTTP Validation Error (Zod-based)
  if (error instanceof HttpValidationError) {
    return res.error(422, 'VALIDATION_ERROR', error.message, {
      errors: error.errors,
      ...(correlationId ? { correlationId } : {}),
    });
  }

  // HTTP Exception classes
  if (error instanceof HttpException) {
    const body: Record<string, unknown> = {
      code: error.code,
      message: error.message,
    };
    if (error.details) body.details = error.details;
    if (correlationId) body.correlationId = correlationId;

    return res.error(error.statusCode, error.code, error.message, error.details);
  }

  // GAO Framework errors (from @gao/core)
  if (isGaoError(error)) {
    let details: any = undefined;

    if (error instanceof ValidationError) {
      details = error.errors;
    }

    return res.error(error.statusCode, error.code, error.message, details);
  }

  // Unhandled generic errors
  if (error instanceof Error) {
    console.error(`[GAO] Unhandled Exception:`, error.stack || error.message);

    return res.error(
      500,
      'INTERNAL_SERVER_ERROR',
      isDev ? error.message : 'An unexpected error occurred.',
      isDev ? { stack: error.stack, correlationId } : { correlationId },
    );
  }

  // Strings or other unknown types
  console.error('[GAO] Unknown Error Type:', error);
  return res.error(500, 'INTERNAL_SERVER_ERROR', 'An undefined error occurred.', { correlationId });
}
