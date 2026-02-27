/**
 * @gao/orm — QueryBuilder Extensions Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryBuilder } from '../src/query-builder.js';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';

function createMockDriver(): DatabaseDriver {
    return {
        connect: vi.fn(),
        disconnect: vi.fn(),
        query: vi.fn().mockResolvedValue([]),
        execute: vi.fn().mockResolvedValue({ rowCount: 0, rows: [] }),
        transaction: vi.fn(),
    } as any;
}

function qb(driver?: DatabaseDriver, dialect: 'postgres' | 'sqlite' = 'postgres') {
    return new QueryBuilder(driver || createMockDriver(), dialect, 'users');
}

describe('QueryBuilder Extensions', () => {
    // ─── whereIn / whereNotIn ────────────────────────────────────

    describe('whereIn', () => {
        it('generates IN clause with positional params', () => {
            const { sql, params } = qb().whereIn('id', [1, 2, 3]).toSql();
            expect(sql).toContain('WHERE "id" IN ($1, $2, $3)');
            expect(params).toEqual([1, 2, 3]);
        });

        it('handles empty array as FALSE condition', () => {
            const { sql } = qb().whereIn('id', []).toSql();
            expect(sql).toContain('WHERE 1');
        });

        it('works with WHERE + whereIn combined', () => {
            const { sql, params } = qb()
                .where('active', true)
                .whereIn('role', ['admin', 'editor'])
                .toSql();
            expect(sql).toContain('"active" = $1');
            expect(sql).toContain('"role" IN ($2, $3)');
            expect(params).toEqual([true, 'admin', 'editor']);
        });
    });

    describe('whereNotIn', () => {
        it('generates NOT IN clause', () => {
            const { sql, params } = qb().whereNotIn('status', ['deleted', 'banned']).toSql();
            expect(sql).toContain('"status" NOT IN ($1, $2)');
            expect(params).toEqual(['deleted', 'banned']);
        });

        it('skips for empty array', () => {
            const { sql } = qb().whereNotIn('status', []).toSql();
            expect(sql).not.toContain('NOT IN');
        });
    });

    // ─── whereNull / whereNotNull ────────────────────────────────

    describe('whereNull / whereNotNull', () => {
        it('generates IS NULL', () => {
            const { sql, params } = qb().whereNull('deleted_at').toSql();
            expect(sql).toContain('"deleted_at" IS NULL');
            expect(params).toEqual([]);
        });

        it('generates IS NOT NULL', () => {
            const { sql, params } = qb().whereNotNull('email').toSql();
            expect(sql).toContain('"email" IS NOT NULL');
            expect(params).toEqual([]);
        });
    });

    // ─── whereBetween ────────────────────────────────────────────

    describe('whereBetween', () => {
        it('generates BETWEEN clause', () => {
            const { sql, params } = qb().whereBetween('age', [18, 65]).toSql();
            expect(sql).toContain('"age" BETWEEN $1 AND $2');
            expect(params).toEqual([18, 65]);
        });

        it('works with dates', () => {
            const start = '2026-01-01';
            const end = '2026-12-31';
            const { sql, params } = qb().whereBetween('created_at', [start, end]).toSql();
            expect(sql).toContain('"created_at" BETWEEN $1 AND $2');
            expect(params).toEqual([start, end]);
        });
    });

    // ─── whereRaw ────────────────────────────────────────────────

    describe('whereRaw', () => {
        it('injects raw SQL with params', () => {
            const { sql, params } = qb()
                .whereRaw('LOWER("email") = $1', ['test@example.com'])
                .toSql();
            expect(sql).toContain('WHERE LOWER("email") = $1');
            expect(params).toEqual(['test@example.com']);
        });

        it('works without params', () => {
            const { sql, params } = qb()
                .whereRaw('"created_at" > NOW() - INTERVAL \'7 days\'')
                .toSql();
            expect(sql).toContain('"created_at" > NOW()');
            expect(params).toEqual([]);
        });
    });

    // ─── selectRaw ───────────────────────────────────────────────

    describe('selectRaw', () => {
        it('adds raw SELECT expressions', () => {
            const { sql } = qb()
                .selectRaw('COUNT(*) as total')
                .toSql();
            expect(sql).toContain('SELECT COUNT(*) as total FROM');
        });

        it('combines with regular selects', () => {
            const { sql } = qb()
                .select('name')
                .selectRaw('COUNT(*) as total')
                .toSql();
            expect(sql).toContain('COUNT(*) as total');
            expect(sql).toContain('name');
        });
    });

    // ─── groupBy / having ────────────────────────────────────────

    describe('groupBy / having', () => {
        it('generates GROUP BY', () => {
            const { sql } = qb().groupBy('department').toSql();
            expect(sql).toContain('GROUP BY "department"');
        });

        it('generates GROUP BY with multiple columns', () => {
            const { sql } = qb().groupBy('department', 'role').toSql();
            expect(sql).toContain('GROUP BY "department", "role"');
        });

        it('generates HAVING clause', () => {
            const { sql, params } = qb()
                .selectRaw('COUNT(*) as cnt')
                .groupBy('department')
                .having('cnt', '>', 5)
                .toSql();
            expect(sql).toContain('HAVING "cnt" > $1');
            expect(params).toEqual([5]);
        });
    });

    // ─── rightJoin ───────────────────────────────────────────────

    describe('rightJoin', () => {
        it('generates RIGHT JOIN', () => {
            const { sql } = qb()
                .rightJoin('orders', 'users.id', '=', 'orders.user_id')
                .toSql();
            expect(sql).toContain('RIGHT JOIN "orders" ON "users"."id" = "orders"."user_id"');
        });
    });

    // ─── Compile Methods ─────────────────────────────────────────

    describe('compileInsertMany', () => {
        it('compiles batch insert', () => {
            const builder = qb();
            const { sql, params } = builder.compileInsertMany([
                { name: 'Alice', email: 'alice@test.com' },
                { name: 'Bob', email: 'bob@test.com' },
            ]);
            expect(sql).toContain('VALUES ($1, $2), ($3, $4)');
            expect(params).toEqual(['Alice', 'alice@test.com', 'Bob', 'bob@test.com']);
        });

        it('throws on empty array', () => {
            expect(() => qb().compileInsertMany([])).toThrow('at least one row');
        });
    });

    describe('compileUpsert', () => {
        it('compiles ON CONFLICT DO UPDATE', () => {
            const builder = qb();
            const { sql, params } = builder.compileUpsert(
                { email: 'test@test.com', name: 'Test' },
                ['email'],
            );
            expect(sql).toContain('ON CONFLICT ("email") DO UPDATE SET');
            expect(sql).toContain('"name" = EXCLUDED."name"');
            expect(params).toEqual(['test@test.com', 'Test']);
        });

        it('compiles ON CONFLICT DO NOTHING when no update columns', () => {
            const builder = qb();
            const { sql } = builder.compileUpsert(
                { email: 'test@test.com' },
                ['email'],
                [],
            );
            expect(sql).toContain('ON CONFLICT ("email") DO NOTHING');
        });
    });

    // ─── WHERE clause reuse in compileUpdate/compileDelete ───────

    describe('compileUpdate with extended WHERE', () => {
        it('uses whereIn in UPDATE', () => {
            const { sql, params } = qb()
                .whereIn('id', ['a', 'b'])
                .compileUpdate({ status: 'archived' });
            expect(sql).toContain('SET "status" = $1');
            expect(sql).toContain('"id" IN ($2, $3)');
            expect(params).toEqual(['archived', 'a', 'b']);
        });
    });

    describe('compileDelete with extended WHERE', () => {
        it('uses whereNull in DELETE', () => {
            const { sql, params } = qb()
                .whereNull('deleted_at')
                .where('status', 'inactive')
                .compileDelete();
            expect(sql).toContain('"deleted_at" IS NULL');
            expect(sql).toContain('"status" = $1');
            expect(params).toEqual(['inactive']);
        });
    });

    // ─── Execute Aggregate Methods ───────────────────────────────

    describe('count', () => {
        it('returns a number', async () => {
            const driver = createMockDriver();
            (driver.query as any).mockResolvedValue([{ aggregate: '42' }]);
            const result = await new QueryBuilder(driver, 'postgres', 'users').count();
            expect(result).toBe(42);
        });
    });

    describe('sum', () => {
        it('returns a number', async () => {
            const driver = createMockDriver();
            (driver.query as any).mockResolvedValue([{ aggregate: '1250.50' }]);
            const result = await new QueryBuilder(driver, 'postgres', 'orders').sum('total');
            expect(result).toBe(1250.50);
        });
    });

    describe('pluck', () => {
        it('returns array of single column values', async () => {
            const driver = createMockDriver();
            (driver.query as any).mockResolvedValue([
                { email: 'a@test.com' },
                { email: 'b@test.com' },
            ]);
            const result = await new QueryBuilder(driver, 'postgres', 'users').pluck<string>('email');
            expect(result).toEqual(['a@test.com', 'b@test.com']);
        });
    });

    describe('exists', () => {
        it('returns true when rows found', async () => {
            const driver = createMockDriver();
            (driver.query as any).mockResolvedValue([{ '?column?': 1 }]);
            const result = await new QueryBuilder(driver, 'postgres', 'users')
                .where('email', 'test@test.com')
                .exists();
            expect(result).toBe(true);
        });

        it('returns false when no rows', async () => {
            const driver = createMockDriver();
            (driver.query as any).mockResolvedValue([]);
            const result = await new QueryBuilder(driver, 'postgres', 'users')
                .where('email', 'nope@test.com')
                .exists();
            expect(result).toBe(false);
        });
    });

    describe('increment / decrement', () => {
        it('compiles increment SQL', async () => {
            const driver = createMockDriver();
            await new QueryBuilder(driver, 'postgres', 'products')
                .where('id', '123')
                .increment('stock', 5);
            expect(driver.execute).toHaveBeenCalledWith(
                expect.stringContaining('"stock" = "stock" + $1'),
                expect.arrayContaining([5, '123']),
            );
        });

        it('compiles decrement SQL', async () => {
            const driver = createMockDriver();
            await new QueryBuilder(driver, 'postgres', 'products')
                .where('id', '123')
                .decrement('stock', 2);
            expect(driver.execute).toHaveBeenCalledWith(
                expect.stringContaining('"stock" = "stock" - $1'),
                expect.arrayContaining([2, '123']),
            );
        });
    });

    // ─── MySQL Dialect ───────────────────────────────────────────

    describe('MySQL dialect', () => {
        it('uses ? placeholders for whereIn', () => {
            const { sql, params } = qb(undefined, 'sqlite')
                .whereIn('id', [1, 2])
                .toSql();
            expect(sql).toContain('IN (?, ?)');
            expect(params).toEqual([1, 2]);
        });

        it('uses ? placeholders for whereBetween', () => {
            const { sql } = qb(undefined, 'sqlite')
                .whereBetween('age', [18, 65])
                .toSql();
            expect(sql).toContain('BETWEEN ? AND ?');
        });
    });

    // ─── Combined Queries ────────────────────────────────────────

    describe('complex combined query', () => {
        it('builds a realistic analytics query', () => {
            const { sql, params } = qb()
                .selectRaw('COUNT(*) as total', 'SUM("amount") as revenue')
                .where('status', 'completed')
                .whereNotNull('paid_at')
                .whereBetween('created_at', ['2026-01-01', '2026-12-31'])
                .whereIn('region', ['US', 'EU', 'APAC'])
                .groupBy('region')
                .having('total', '>', 10)
                .orderBy('revenue', 'DESC')
                .limit(5)
                .toSql();

            expect(sql).toContain('SELECT COUNT(*) as total, SUM("amount") as revenue');
            expect(sql).toContain('"status" = $1');
            expect(sql).toContain('"paid_at" IS NOT NULL');
            expect(sql).toContain('"created_at" BETWEEN $2 AND $3');
            expect(sql).toContain('"region" IN ($4, $5, $6)');
            expect(sql).toContain('GROUP BY "region"');
            expect(sql).toContain('HAVING "total" > $7');
            expect(sql).toContain('ORDER BY "revenue" DESC');
            expect(sql).toContain('LIMIT 5');
            expect(params).toEqual(['completed', '2026-01-01', '2026-12-31', 'US', 'EU', 'APAC', 10]);
        });
    });
});
