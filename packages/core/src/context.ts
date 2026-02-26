/**
 * @gao/core — Request Context (AsyncLocalStorage)
 *
 * Thread-local-like storage for request-scoped data:
 * - Correlation ID — propagated through entire async chain
 * - User context — accessible from any service layer
 * - Request metadata — without passing parameters everywhere
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface RequestContext {
  readonly correlationId: string;
  readonly startTime: number;
  userId?: string;
  userRoles?: readonly string[];
  metadata: Record<string, unknown>;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Run a function within a request context.
 * All async code inside will have access to the context.
 */
export function runWithContext<T>(context: Partial<RequestContext>, fn: () => T): T {
  const fullContext: RequestContext = {
    correlationId: context.correlationId ?? randomUUID(),
    startTime: context.startTime ?? Date.now(),
    userId: context.userId,
    userRoles: context.userRoles,
    metadata: context.metadata ?? {},
  };

  return storage.run(fullContext, fn);
}

/**
 * Get the current request context.
 * Returns undefined if called outside a context scope.
 */
export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

/**
 * Get the current correlation ID.
 * Returns 'no-context' if called outside a context scope.
 */
export function getCorrelationId(): string {
  return storage.getStore()?.correlationId ?? 'no-context';
}

/**
 * Get the current user ID from context.
 */
export function getUserId(): string | undefined {
  return storage.getStore()?.userId;
}

/**
 * Set a metadata value on the current context.
 */
export function setContextMetadata(key: string, value: unknown): void {
  const ctx = storage.getStore();
  if (ctx) {
    ctx.metadata[key] = value;
  }
}
