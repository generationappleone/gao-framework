import { describe, it, expect } from 'vitest';
import {
    BUDGET_PLANS,
    BudgetExceededError,
    createBudgetContext,
    runWithBudget,
    getBudget,
    trackDbQuery,
    trackResponseBytes,
    checkCpuBudget,
} from '../src/budget.js';

describe('Budget System', () => {
    describe('BudgetPlan presets', () => {
        it('should have free, pro, enterprise plans', () => {
            expect(BUDGET_PLANS.free).toBeDefined();
            expect(BUDGET_PLANS.pro).toBeDefined();
            expect(BUDGET_PLANS.enterprise).toBeDefined();
        });

        it('should have progressive limits', () => {
            expect(BUDGET_PLANS.pro!.requestsPerMinute).toBeGreaterThan(BUDGET_PLANS.free!.requestsPerMinute);
            expect(BUDGET_PLANS.enterprise!.requestsPerMinute).toBeGreaterThan(BUDGET_PLANS.pro!.requestsPerMinute);
        });
    });

    describe('createBudgetContext', () => {
        it('should create context with zero counters', () => {
            const ctx = createBudgetContext('req-1', BUDGET_PLANS.free!);
            expect(ctx.requestId).toBe('req-1');
            expect(ctx.dbQueryCount).toBe(0);
            expect(ctx.responseBytes).toBe(0);
            expect(ctx.startTime).toBeGreaterThan(0);
        });
    });

    describe('trackDbQuery', () => {
        it('should increment db query counter within budget scope', async () => {
            const ctx = createBudgetContext('req-1', { ...BUDGET_PLANS.free!, maxDbQueries: 3 });

            await runWithBudget(ctx, () => {
                trackDbQuery();
                trackDbQuery();
                expect(getBudget()?.dbQueryCount).toBe(2);
            });
        });

        it('should throw BudgetExceededError when over limit', () => {
            const ctx = createBudgetContext('req-1', { ...BUDGET_PLANS.free!, maxDbQueries: 2 });

            expect(() =>
                runWithBudget(ctx, () => {
                    trackDbQuery();
                    trackDbQuery();
                    trackDbQuery(); // 3rd exceeds limit of 2
                }),
            ).toThrow(BudgetExceededError);
        });

        it('should be no-op outside budget scope', () => {
            // Should not throw
            expect(() => trackDbQuery()).not.toThrow();
        });
    });

    describe('trackResponseBytes', () => {
        it('should track accumulated response bytes', async () => {
            const ctx = createBudgetContext('req-1', { ...BUDGET_PLANS.free!, maxResponseBytes: 1000 });

            await runWithBudget(ctx, () => {
                trackResponseBytes(100);
                trackResponseBytes(200);
                expect(getBudget()?.responseBytes).toBe(300);
            });
        });

        it('should throw when response size exceeded', () => {
            const ctx = createBudgetContext('req-1', { ...BUDGET_PLANS.free!, maxResponseBytes: 100 });

            expect(() =>
                runWithBudget(ctx, () => {
                    trackResponseBytes(50);
                    trackResponseBytes(60); // Total 110 > 100
                }),
            ).toThrow(BudgetExceededError);
        });
    });

    describe('checkCpuBudget', () => {
        it('should pass when within time budget', async () => {
            const ctx = createBudgetContext('req-1', { ...BUDGET_PLANS.free!, maxCpuTimeMs: 5000 });

            await runWithBudget(ctx, () => {
                expect(() => checkCpuBudget()).not.toThrow();
            });
        });

        it('should throw when CPU time exceeded', () => {
            const ctx = createBudgetContext('req-1', { ...BUDGET_PLANS.free!, maxCpuTimeMs: 1 });
            // Artificially set startTime in the past
            (ctx as any).startTime = Date.now() - 100;

            expect(() =>
                runWithBudget(ctx, () => {
                    checkCpuBudget();
                }),
            ).toThrow(BudgetExceededError);
        });
    });

    describe('BudgetExceededError', () => {
        it('should have correct dimension and status', () => {
            const err = new BudgetExceededError('DB_QUERIES', 'Too many queries');
            expect(err.dimension).toBe('DB_QUERIES');
            expect(err.statusCode).toBe(429);
            expect(err.name).toBe('BudgetExceededError');
        });
    });
});
