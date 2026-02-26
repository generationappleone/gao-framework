/**
 * @gao/core — Public API
 *
 * Barrel export: only export what users need.
 */

// ─── Core Classes ────────────────────────────────────────────
export { GaoApplication, createApp } from './application.js';
export { Container, createContainer } from './container.js';
export { Router, createRouter } from './router.js';
export { Logger, createLogger } from './logger.js';
export { EventEmitter, createEventEmitter } from './events.js';
export { CacheService, MemoryCacheAdapter, createCacheService } from './cache.js';
export { PluginManager, createPluginManager } from './plugin.js';

// ─── Config ──────────────────────────────────────────────────
export { loadConfig, defineConfig } from './config.js';
export type { ConfigLoaderOptions } from './config.js';

// ─── Context (AsyncLocalStorage) ─────────────────────────────
export {
  runWithContext,
  getContext,
  getCorrelationId,
  getUserId,
  setContextMetadata,
} from './context.js';
export type { RequestContext } from './context.js';

// ─── Errors ──────────────────────────────────────────────────
export {
  GaoError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  InternalError,
  TimeoutError,
  isGaoError,
} from './errors.js';
export type { ValidationFieldError, ErrorMetadata } from './errors.js';

// ─── Types ───────────────────────────────────────────────────
export type {
  GaoApp,
  GaoConfig,
  AppConfig,
  Plugin,
  Middleware,
  MiddlewareFunction,
  NextFunction,
  GaoContext,
  HttpMethod,
  Route,
  RouteHandler,
  RouteMatch,
  RouteParams,
  Lifetime,
  ServiceRegistration,
  LogLevel,
  LogEntry,
  EventListener,
  EventSubscription,
  CacheAdapter,
  CacheOptions,
} from './types.js';
