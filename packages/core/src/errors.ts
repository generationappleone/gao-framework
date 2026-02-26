/**
 * @gao/core — Error System
 *
 * Base error hierarchy with error codes, correlation ID support,
 * and structured error metadata for debugging.
 */

export interface ErrorMetadata {
  readonly [key: string]: unknown;
}

/**
 * Base error class for all GAO Framework errors.
 * Provides error codes, HTTP status mapping, and correlation ID tracking.
 */
export abstract class GaoError extends Error {
  public abstract readonly code: string;
  public abstract readonly statusCode: number;
  public readonly correlationId?: string;
  public readonly metadata: ErrorMetadata;
  public readonly timestamp: string;

  constructor(
    message: string,
    options?: {
      cause?: Error;
      correlationId?: string;
      metadata?: ErrorMetadata;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.correlationId = options?.correlationId;
    this.metadata = Object.freeze(options?.metadata ?? {});
    this.timestamp = new Date().toISOString();

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      correlationId: this.correlationId,
      metadata: this.metadata,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV !== 'production' && { stack: this.stack }),
    };
  }
}

// ─── Concrete Error Types ────────────────────────────────────

export class NotFoundError extends GaoError {
  public readonly code = 'NOT_FOUND';
  public readonly statusCode = 404;
}

export class ValidationError extends GaoError {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 422;

  constructor(
    message: string,
    public readonly errors: readonly ValidationFieldError[],
    options?: { cause?: Error; correlationId?: string },
  ) {
    super(message, { ...options, metadata: { errors } });
  }
}

export interface ValidationFieldError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export class UnauthorizedError extends GaoError {
  public readonly code = 'UNAUTHORIZED';
  public readonly statusCode = 401;
}

export class ForbiddenError extends GaoError {
  public readonly code = 'FORBIDDEN';
  public readonly statusCode = 403;
}

export class ConflictError extends GaoError {
  public readonly code = 'CONFLICT';
  public readonly statusCode = 409;
}

export class RateLimitError extends GaoError {
  public readonly code = 'RATE_LIMIT_EXCEEDED';
  public readonly statusCode = 429;

  constructor(
    message = 'Too many requests',
    public readonly retryAfter: number = 60,
    options?: { correlationId?: string },
  ) {
    super(message, { ...options, metadata: { retryAfter } });
  }
}

export class InternalError extends GaoError {
  public readonly code = 'INTERNAL_ERROR';
  public readonly statusCode = 500;
}

export class TimeoutError extends GaoError {
  public readonly code = 'TIMEOUT';
  public readonly statusCode = 408;
}

/**
 * Type guard: check if an unknown error is a GaoError
 */
export function isGaoError(error: unknown): error is GaoError {
  return error instanceof GaoError;
}
