import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';
import { QueryBuilder } from '../src/query-builder.js';
import { Expr } from '../src/expressions/expr.js';

describe('QueryBuilder + Expression Integration', () => {
    let mockDriver: DatabaseDriver;

    beforeEach(() => {
        mockDriver = {
            query: vi.fn(),
            execute: vi.fn(),
            connect: vi.fn(),
            disconnect: vi.fn(),
            transaction: vi.fn(),
        } as unknown as DatabaseDriver;
    });

    // ─── SELECT with Expressions ───────────────────────────────

    describe('select() with expressions', () => {
        it('should accept Expression objects in select', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'orders');
            qb.select(
                Expr.col('id'),
                Expr.col('price').multiply(Expr.col('qty')).as('total'),
            );
            const { sql, params } = qb.toSql();
            expect(sql).toBe('SELECT "id", ("price" * "qty") AS "total" FROM "orders"');
            expect(params).toEqual([]);
        });

        it('should mix string and Expression selects', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
            qb.select(
                'name',
                Expr.cast('id', 'text').as('id_text'),
            );
            const { sql } = qb.toSql();
            expect(sql).toBe('SELECT name, CAST("id" AS TEXT) AS "id_text" FROM "users"');
        });

        it('should handle CAST with alias in mysql', () => {
            const qb = new QueryBuilder(mockDriver, 'mysql', 'users');
            qb.select(Expr.cast('id', 'text').as('id_text'));
            const { sql } = qb.toSql();
            // Note: QB's own quoteIdentifier uses " for table names; Expression uses ` for MySQL columns
            expect(sql).toBe('SELECT CAST(`id` AS CHAR) AS `id_text` FROM "users"');
        });

        it('should handle multiple expression selects with params', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'products');
            qb.select(
                Expr.col('name'),
                Expr.col('price').multiply(1.11).as('price_with_tax'),
                Expr.coalesce(Expr.col('stock'), Expr.val(0)).as('safe_stock'),
            );
            const { sql, params } = qb.toSql();
            expect(sql).toContain('("price" * $1) AS "price_with_tax"');
            expect(sql).toContain('COALESCE("stock", $2) AS "safe_stock"');
            expect(params).toEqual([1.11, 0]);
        });

        it('should handle aggregates as select expressions', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'orders');
            qb.select(
                'user_id',
                Expr.count().as('order_count'),
                Expr.sum('total').as('revenue'),
            ).groupBy('user_id');
            const { sql } = qb.toSql();
            expect(sql).toContain('COUNT(*) AS "order_count"');
            expect(sql).toContain('SUM("total") AS "revenue"');
            expect(sql).toContain('GROUP BY "user_id"');
        });
    });

    // ─── WHERE with Expressions ────────────────────────────────

    describe('where() with expressions', () => {
        it('should accept Expression as column in where', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'orders');
            qb.where(Expr.col('price').multiply(Expr.col('qty')), '>', 100000);
            const { sql, params } = qb.toSql();
            expect(sql).toBe('SELECT * FROM "orders" WHERE ("price" * "qty") > $1');
            expect(params).toEqual([100000]);
        });

        it('should accept Expression in orWhere', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'products');
            qb.where('active', true).orWhere(Expr.col('stock'), '>', 0);
            const { sql, params } = qb.toSql();
            expect(sql).toBe('SELECT * FROM "products" WHERE "active" = $1 OR "stock" > $2');
            expect(params).toEqual([true, 0]);
        });

        it('should handle CAST expression in WHERE', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
            qb.where(Expr.cast('id', 'text'), 'LIKE', '%abc%');
            const { sql, params } = qb.toSql();
            expect(sql).toBe('SELECT * FROM "users" WHERE CAST("id" AS TEXT) LIKE $1');
            expect(params).toEqual(['%abc%']);
        });

        it('should track param offsets correctly with expression where + regular where', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'orders');
            qb.where('status', 'active')
                .where(Expr.col('price').multiply(Expr.col('qty')), '>', 500)
                .where('user_id', 10);
            const { sql, params } = qb.toSql();
            expect(sql).toBe(
                'SELECT * FROM "orders" WHERE "status" = $1 AND ("price" * "qty") > $2 AND "user_id" = $3',
            );
            expect(params).toEqual(['active', 500, 10]);
        });
    });

    // ─── ORDER BY with Expressions ─────────────────────────────

    describe('orderBy() with expressions', () => {
        it('should accept Expression in orderBy', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'products');
            qb.orderBy(Expr.col('price').multiply(Expr.col('qty')), 'DESC');
            const { sql } = qb.toSql();
            expect(sql).toContain('ORDER BY ("price" * "qty") DESC');
        });
    });

    // ─── HAVING with Expressions ───────────────────────────────

    describe('having() with expressions', () => {
        it('should accept Expression in having', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'orders');
            qb.select('user_id', Expr.sum('total').as('revenue'))
                .groupBy('user_id')
                .having(Expr.sum('total'), '>', 10000);
            const { sql, params } = qb.toSql();
            expect(sql).toContain('HAVING SUM("total") > $1');
            expect(params).toContain(10000);
        });
    });

    // ─── CASE WHEN Integration ─────────────────────────────────

    describe('CASE WHEN in SELECT', () => {
        it('should compile CASE WHEN in select', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'orders');
            qb.select(
                'id',
                Expr.caseWhen()
                    .when('status', '=', 'paid', 'Completed')
                    .when('status', '=', 'pending', 'Waiting')
                    .else('Unknown')
                    .as('status_label'),
            );
            const { sql, params } = qb.toSql();
            expect(sql).toContain('CASE WHEN "status" = $1 THEN $2 WHEN "status" = $3 THEN $4 ELSE $5 END AS "status_label"');
            expect(params).toEqual(['paid', 'Completed', 'pending', 'Waiting', 'Unknown']);
        });
    });

    // ─── JSON Integration ──────────────────────────────────────

    describe('JSON expressions in queries', () => {
        it('should compile JSON extract in select for postgres', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
            qb.select('name', Expr.jsonExtract('settings', 'theme').as('user_theme'));
            const { sql } = qb.toSql();
            expect(sql).toContain("\"settings\"->>'theme' AS \"user_theme\"");
        });

        it('should compile JSON extract for mysql', () => {
            const qb = new QueryBuilder(mockDriver, 'mysql', 'users');
            qb.select('name', Expr.jsonExtract('settings', 'theme').as('user_theme'));
            const { sql } = qb.toSql();
            expect(sql).toContain("JSON_EXTRACT(`settings`, '$.theme') AS `user_theme`");
        });
    });

    // ─── Complex Real-World Queries ────────────────────────────

    describe('Complex real-world queries', () => {
        it('should build a complete reporting query', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'orders');
            qb.select(
                'user_id',
                Expr.extract('month', 'created_at').as('month'),
                Expr.count().as('order_count'),
                Expr.sum(Expr.col('price').multiply(Expr.col('qty'))).as('revenue'),
            )
                .where('status', 'completed')
                .groupBy('user_id')
                .having(Expr.sum(Expr.col('price').multiply(Expr.col('qty'))), '>', 50000)
                .orderBy(Expr.sum(Expr.col('price').multiply(Expr.col('qty'))), 'DESC');

            const { sql, params } = qb.toSql();

            // Verify structure
            expect(sql).toContain('SELECT');
            expect(sql).toContain('EXTRACT(MONTH FROM "created_at") AS "month"');
            expect(sql).toContain('COUNT(*) AS "order_count"');
            expect(sql).toContain('SUM(("price" * "qty")) AS "revenue"');
            expect(sql).toContain('WHERE "status" = $1');
            expect(sql).toContain('GROUP BY "user_id"');
            expect(sql).toContain('HAVING SUM(("price" * "qty")) >');
            expect(sql).toContain('ORDER BY SUM(("price" * "qty")) DESC');
            expect(params[0]).toBe('completed');
        });

        it('should build UUID text search query', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
            qb.where(Expr.cast('id', 'text'), 'LIKE', '%abc%');
            const { sql, params } = qb.toSql();
            expect(sql).toBe('SELECT * FROM "users" WHERE CAST("id" AS TEXT) LIKE $1');
            expect(params).toEqual(['%abc%']);
        });

        it('should build price calculation query', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'products');
            qb.select(
                'name',
                Expr.col('price').as('base_price'),
                Expr.col('price').multiply(1.11).as('price_with_tax'),
                Expr.col('price').multiply(Expr.col('stock')).as('inventory_value'),
            ).where(Expr.col('price').multiply(Expr.col('stock')), '>', 1000000);

            const { sql, params } = qb.toSql();
            expect(sql).toContain('"price" AS "base_price"');
            expect(sql).toContain('("price" * $1) AS "price_with_tax"');
            expect(sql).toContain('("price" * "stock") AS "inventory_value"');
            expect(sql).toContain('WHERE ("price" * "stock") > $2');
            expect(params).toEqual([1.11, 1000000]);
        });
    });

    // ─── Backward Compatibility ────────────────────────────────

    describe('Backward compatibility', () => {
        it('should still support plain string selects', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
            qb.select('id', 'name', 'email');
            const { sql } = qb.toSql();
            expect(sql).toBe('SELECT id, name, email FROM "users"');
        });

        it('should still support selectRaw', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
            qb.selectRaw('COUNT(*) as total');
            const { sql } = qb.toSql();
            expect(sql).toContain('COUNT(*) as total');
        });

        it('should still support string where', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
            qb.where('name', 'Alice');
            const { sql, params } = qb.toSql();
            expect(sql).toBe('SELECT * FROM "users" WHERE "name" = $1');
            expect(params).toEqual(['Alice']);
        });

        it('should still support whereRaw', () => {
            const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
            qb.whereRaw('"age" > $1', [18]);
            const { sql, params } = qb.toSql();
            expect(sql).toBe('SELECT * FROM "users" WHERE "age" > $1');
            expect(params).toEqual([18]);
        });
    });
});
