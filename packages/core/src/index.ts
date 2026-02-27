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
export { RedisCacheAdapter, createRedisClient } from './redis.js';
export type { RedisLikeClient, RedisClientConfig } from './redis.js';
export { PluginManager, createPluginManager } from './plugin.js';

// ─── Dependency Injection Decorators ─────────────────────────
export { Inject, Injectable, getInjectTokens, isInjectable } from './inject.js';
export type { InjectToken } from './inject.js';

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

// ─── Efficiency Primitives (v0.4.0) ─────────────────────────
export { ObjectPool } from './object-pool.js';
export type { ObjectPoolOptions } from './object-pool.js';
export { LRUCacheAdapter } from './lru-cache.js';
export type { LRUCacheOptions } from './lru-cache.js';
export { SlidingWindowLimiter } from './sliding-window.js';
export type { SlidingWindowResult } from './sliding-window.js';

// ─── Permission & Isolation (v0.4.0) ────────────────────────
export {
  PermissionSet,
  SERVICE_PERMISSIONS,
  registerServicePermission,
} from './permission.js';
export type { Permission } from './permission.js';
export { ScopedContainer, createScopedContainer } from './scoped-container.js';

// ─── Budget System (v0.4.0) ─────────────────────────────────
export {
  BUDGET_PLANS,
  BudgetExceededError,
  createBudgetContext,
  runWithBudget,
  getBudget,
  trackDbQuery,
  trackResponseBytes,
  checkCpuBudget,
} from './budget.js';
export type {
  BudgetPlan,
  BudgetDimension,
  RequestBudgetContext,
} from './budget.js';

// ─── Plugin Marketplace (v0.4.0) ────────────────────────────
export { validateManifest } from './plugin-manifest.js';
export type { PluginManifest } from './plugin-manifest.js';
export { WorkerSandbox } from './worker-sandbox.js';
export type { WorkerSandboxOptions } from './worker-sandbox.js';
export { PluginMarketplace } from './plugin-marketplace.js';
export type { InstalledPlugin } from './plugin-marketplace.js';
