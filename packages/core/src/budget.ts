/**
 * @gao/core — Budget System
 *
 * Multi-dimensional resource budget enforcement per request.
 * Uses AsyncLocalStorage for zero-argument propagation through async call chains.
 *
 * Dimensions tracked:
 * - Request rate (sliding window)
 * - CPU time per request
 * - DB query count per request
 * - Response size per request
 * - Concurrent request count
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { RateLimitError } from './errors.js';

// ─── Budget Plan ─────────────────────────────────────────────

/** Defines resource limits for a tier/plan. */
export interface BudgetPlan {
    /** Plan name (e.g., 'free', 'pro', 'enterprise'). */
    name: string;
    /** Max requests per minute. */
    requestsPerMinute: number;
    /** Max CPU time per request in milliseconds. */
    maxCpuTimeMs: number;
    /** Max database queries per request. */
    maxDbQueries: number;
    /** Max response body size per request in bytes. */
    maxResponseBytes: number;
    /** Max concurrent active requests per user. */
    maxConcurrent: number;
    /** Max heap memory for a plugin worker isolate in MB. */
    maxHeapMB: number;
}

/** Pre-defined budget plans. */
export const BUDGET_PLANS: Readonly<Record<string, BudgetPlan>> = {
    free: {
        name: 'free',
        requestsPerMinute: 60,
        maxCpuTimeMs: 3000,
        maxDbQueries: 20,
        maxResponseBytes: 1 * 1024 * 1024,
        maxConcurrent: 5,
        maxHeapMB: 64,
    },
    pro: {
        name: 'pro',
        requestsPerMinute: 600,
        maxCpuTimeMs: 10000,
        maxDbQueries: 100,
        maxResponseBytes: 10 * 1024 * 1024,
        maxConcurrent: 50,
        maxHeapMB: 256,
    },
    enterprise: {
        name: 'enterprise',
        requestsPerMinute: 6000,
        maxCpuTimeMs: 30000,
        maxDbQueries: 500,
        maxResponseBytes: 50 * 1024 * 1024,
        maxConcurrent: 200,
        maxHeapMB: 512,
    },
};

// ─── Budget Exceeded Error ───────────────────────────────────

export type BudgetDimension =
    | 'CPU_TIME'
    | 'DB_QUERIES'
    | 'RESPONSE_SIZE'
    | 'CONCURRENT'
    | 'REQUEST_RATE';

export class BudgetExceededError extends RateLimitError {
    public readonly dimension: BudgetDimension;

    constructor(dimension: BudgetDimension, message: string, retryAfter = 60) {
        super(message, retryAfter);
        this.dimension = dimension;
        this.name = 'BudgetExceededError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

// ─── Request Budget Context ──────────────────────────────────

/** Per-request mutable budget tracking.  */
export interface RequestBudgetContext {
    readonly requestId: string;
    readonly plan: BudgetPlan;
    readonly startTime: number;

    // Mutable counters
    dbQueryCount: number;
    responseBytes: number;
}

const budgetStorage = new AsyncLocalStorage<RequestBudgetContext>();

/** Get the current request's budget context. `undefined` if not in a budgeted scope. */
export function getBudget(): RequestBudgetContext | undefined {
    return budgetStorage.getStore();
}

/**
 * Run a function within a budget-tracked scope.
 * Budget helpers (trackDbQuery, etc.) will work inside this scope.
 */
export function runWithBudget<T>(
    context: RequestBudgetContext,
    fn: () => T | Promise<T>,
): T | Promise<T> {
    return budgetStorage.run(context, fn);
}

/**
 * Create a new budget context for a request.
 */
export function createBudgetContext(
    requestId: string,
    plan: BudgetPlan,
): RequestBudgetContext {
    return {
        requestId,
        plan,
        startTime: Date.now(),
        dbQueryCount: 0,
        responseBytes: 0,
    };
}

// ─── Budget Tracking Functions ───────────────────────────────

/**
 * Record a database query. Throws BudgetExceededError if over limit.
 * No-op if called outside a budget scope.
 */
export function trackDbQuery(): void {
    const ctx = budgetStorage.getStore();
    if (!ctx) return;

    ctx.dbQueryCount++;
    if (ctx.dbQueryCount > ctx.plan.maxDbQueries) {
        throw new BudgetExceededError(
            'DB_QUERIES',
            `DB query budget exceeded: ${ctx.dbQueryCount}/${ctx.plan.maxDbQueries} queries`,
        );
    }
}

/**
 * Record response bytes written. Throws BudgetExceededError if over limit.
 * No-op if called outside a budget scope.
 */
export function trackResponseBytes(bytes: number): void {
    const ctx = budgetStorage.getStore();
    if (!ctx) return;

    ctx.responseBytes += bytes;
    if (ctx.responseBytes > ctx.plan.maxResponseBytes) {
        throw new BudgetExceededError(
            'RESPONSE_SIZE',
            `Response size budget exceeded: ${ctx.responseBytes}/${ctx.plan.maxResponseBytes} bytes`,
        );
    }
}

/**
 * Check if CPU time budget has been exceeded. Throws BudgetExceededError if over.
 * No-op if called outside a budget scope.
 */
export function checkCpuBudget(): void {
    const ctx = budgetStorage.getStore();
    if (!ctx) return;

    const elapsed = Date.now() - ctx.startTime;
    if (elapsed > ctx.plan.maxCpuTimeMs) {
        throw new BudgetExceededError(
            'CPU_TIME',
            `CPU time budget exceeded: ${elapsed}ms/${ctx.plan.maxCpuTimeMs}ms`,
        );
    }
}
