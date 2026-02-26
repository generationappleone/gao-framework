/**
 * @gao/core — Logger
 *
 * Pino-based structured JSON logger with:
 * - Auto-redaction of sensitive fields
 * - Correlation ID context via AsyncLocalStorage
 * - Development-friendly pretty printing
 */

import pino from 'pino';
import type { LogLevel } from './types.js';

/** Fields that are automatically redacted from log output */
const REDACTED_FIELDS: readonly string[] = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'creditCard',
  'credit_card',
  'ssn',
  'privateKey',
  'private_key',
];

/** Build redaction paths for nested objects (top-level + one level deep) */
function buildRedactPaths(fields: readonly string[]): string[] {
  const paths: string[] = [];
  for (const field of fields) {
    paths.push(field);
    paths.push(`*.${field}`);
  }
  return paths;
}

export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly name?: string;
  readonly pretty?: boolean;
  readonly redactFields?: readonly string[];
}

export class Logger {
  private readonly pino: pino.Logger;

  constructor(options: LoggerOptions = {}) {
    const redactFields = [...REDACTED_FIELDS, ...(options.redactFields ?? [])];

    this.pino = pino({
      name: options.name ?? 'gao',
      level: options.level ?? 'info',
      redact: {
        paths: buildRedactPaths(redactFields),
        censor: '[REDACTED]',
      },
      ...(options.pretty
        ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
        : {}),
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  /**
   * Create a child logger with bound context (e.g. correlation ID)
   */
  child(bindings: Record<string, unknown>): Logger {
    const childLogger = Object.create(Logger.prototype) as Logger;
    Object.defineProperty(childLogger, 'pino', {
      value: this.pino.child(bindings),
      writable: false,
    });
    return childLogger;
  }

  trace(msg: string, data?: Record<string, unknown>): void {
    if (data) {
      this.pino.trace(data, msg);
    } else {
      this.pino.trace(msg);
    }
  }

  debug(msg: string, data?: Record<string, unknown>): void {
    if (data) {
      this.pino.debug(data, msg);
    } else {
      this.pino.debug(msg);
    }
  }

  info(msg: string, data?: Record<string, unknown>): void {
    if (data) {
      this.pino.info(data, msg);
    } else {
      this.pino.info(msg);
    }
  }

  warn(msg: string, data?: Record<string, unknown>): void {
    if (data) {
      this.pino.warn(data, msg);
    } else {
      this.pino.warn(msg);
    }
  }

  error(msg: string, data?: Record<string, unknown>): void {
    if (data) {
      this.pino.error(data, msg);
    } else {
      this.pino.error(msg);
    }
  }

  fatal(msg: string, data?: Record<string, unknown>): void {
    if (data) {
      this.pino.fatal(data, msg);
    } else {
      this.pino.fatal(msg);
    }
  }
}

/**
 * Create a pre-configured logger instance.
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}
