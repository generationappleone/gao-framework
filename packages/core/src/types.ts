import type { z } from 'zod';

// ─── Middleware ───────────────────────────────────────────────
export type NextFunction = () => Promise<void> | void;

export interface GaoContext {
  readonly correlationId: string;
  readonly startTime: number;
  readonly metadata: Record<string, unknown>;
}

export type MiddlewareFunction = (ctx: GaoContext, next: NextFunction) => Promise<void> | void;

export interface Middleware {
  readonly name: string;
  handle: MiddlewareFunction;
}

// ─── Router ──────────────────────────────────────────────────
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface RouteParams {
  readonly [key: string]: string;
}

export interface Route {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: RouteHandler;
  readonly middlewares: readonly MiddlewareFunction[];
  readonly meta: Record<string, unknown>;
}

export type RouteHandler = (ctx: GaoContext) => Promise<unknown> | unknown;

export interface RouteMatch {
  readonly handler: RouteHandler;
  readonly params: RouteParams;
  readonly middlewares: readonly MiddlewareFunction[];
  readonly meta: Record<string, unknown>;
}

// ─── DI Container ────────────────────────────────────────────
export type Lifetime = 'singleton' | 'transient';

export interface ServiceRegistration<T = unknown> {
  readonly token: symbol | string;
  readonly lifetime: Lifetime;
  readonly factory: () => T;
  instance?: T;
}

// ─── Plugin ──────────────────────────────────────────────────
export interface Plugin {
  readonly name: string;
  readonly version?: string;
  onRegister?(app: GaoApp): void | Promise<void>;
  onBoot?(app: GaoApp): void | Promise<void>;
  onShutdown?(app: GaoApp): void | Promise<void>;
}

// ─── Application ─────────────────────────────────────────────
export interface GaoApp {
  readonly config: GaoConfig;
  register(plugin: Plugin): void;
  resolve<T>(token: symbol | string): T;
}

// ─── Config ──────────────────────────────────────────────────
export interface GaoConfig {
  readonly app: AppConfig;
  readonly [key: string]: unknown;
}

export interface AppConfig {
  readonly name: string;
  readonly port: number;
  readonly environment: 'development' | 'staging' | 'production' | 'test';
  readonly debug: boolean;
}

export type ConfigSchema<T> = z.ZodType<T>;

// ─── Logger ──────────────────────────────────────────────────
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly correlationId?: string;
  readonly [key: string]: unknown;
}

// ─── Events ──────────────────────────────────────────────────
export type EventListener<T = unknown> = (payload: T) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe(): void;
}

// ─── Cache ───────────────────────────────────────────────────
export interface CacheOptions {
  readonly ttl?: number; // seconds
  readonly namespace?: string;
}

export interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(namespace?: string): Promise<void>;
  has(key: string): Promise<boolean>;
}
