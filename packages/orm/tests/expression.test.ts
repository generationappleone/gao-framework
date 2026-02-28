import { describe, expect, it } from 'vitest';
import { Expr } from '../src/expressions/expr.js';
import type { Dialect } from '../src/expressions/expression.js';

const dialects: Dialect[] = ['postgres', 'mysql', 'mariadb', 'sqlite'];

describe('Expression Builder', () => {
    // ─── Core Expressions ──────────────────────────────────────

    describe('ColumnExpr', () => {
        it.each([
            ['postgres', '"name"'],
            ['mysql', '`name`'],
            ['mariadb', '`name`'],
            ['sqlite', '"name"'],
        ] as [Dialect, string][])('should quote identifier for %s', (dialect, expected) => {
            const { sql, params } = Expr.col('name').toSql(dialect, 0);
            expect(sql).toBe(expected);
            expect(params).toEqual([]);
        });

        it('should quote dotted identifiers', () => {
            const { sql } = Expr.col('users.name').toSql('postgres', 0);
            expect(sql).toBe('"users"."name"');
        });

        it('should quote dotted identifiers for mysql', () => {
            const { sql } = Expr.col('users.name').toSql('mysql', 0);
            expect(sql).toBe('`users`.`name`');
        });
    });

    describe('LiteralExpr', () => {
        it('should use $1 for postgres', () => {
            const { sql, params } = Expr.val(42).toSql('postgres', 0);
            expect(sql).toBe('$1');
            expect(params).toEqual([42]);
        });

        it('should use $N with offset for postgres', () => {
            const { sql, params } = Expr.val('hello').toSql('postgres', 3);
            expect(sql).toBe('$4');
            expect(params).toEqual(['hello']);
        });

        it('should use ? for mysql', () => {
            const { sql, params } = Expr.val(42).toSql('mysql', 5);
            expect(sql).toBe('?');
            expect(params).toEqual([42]);
        });
    });

    describe('AliasExpr', () => {
        it('should append AS "alias"', () => {
            const { sql } = Expr.col('name').as('display_name').toSql('postgres', 0);
            expect(sql).toBe('"name" AS "display_name"');
        });

        it('should use backticks for mysql alias', () => {
            const { sql } = Expr.col('name').as('display_name').toSql('mysql', 0);
            expect(sql).toBe('`name` AS `display_name`');
        });
    });

    describe('RawExpr', () => {
        it('should pass through raw SQL', () => {
            const { sql, params } = Expr.raw('CUSTOM_FN(x, y)').toSql('postgres', 0);
            expect(sql).toBe('CUSTOM_FN(x, y)');
            expect(params).toEqual([]);
        });

        it('should support raw params', () => {
            const { sql, params } = Expr.raw('x = $1', [42]).toSql('postgres', 0);
            expect(sql).toBe('x = $1');
            expect(params).toEqual([42]);
        });
    });

    // ─── CastExpr ──────────────────────────────────────────────

    describe('CastExpr', () => {
        it.each([
            ['postgres', 'text', 'CAST("id" AS TEXT)'],
            ['mysql', 'text', 'CAST(`id` AS CHAR)'],
            ['mariadb', 'text', 'CAST(`id` AS CHAR)'],
            ['sqlite', 'text', 'CAST("id" AS TEXT)'],
        ] as [Dialect, string, string][])('should cast to %s text', (dialect, type, expected) => {
            const { sql, params } = Expr.cast('id', type as any).toSql(dialect, 0);
            expect(sql).toBe(expected);
            expect(params).toEqual([]);
        });

        it.each([
            ['postgres', 'integer', 'CAST("price" AS INTEGER)'],
            ['mysql', 'integer', 'CAST(`price` AS SIGNED)'],
            ['sqlite', 'integer', 'CAST("price" AS INTEGER)'],
        ] as [Dialect, string, string][])('should cast to %s integer', (dialect, type, expected) => {
            const { sql } = Expr.cast('price', type as any).toSql(dialect, 0);
            expect(sql).toBe(expected);
        });

        it.each([
            ['postgres', 'uuid', 'CAST("code" AS UUID)'],
            ['mysql', 'uuid', 'CAST(`code` AS CHAR(36))'],
            ['sqlite', 'uuid', 'CAST("code" AS TEXT)'],
        ] as [Dialect, string, string][])('should cast to %s uuid', (dialect, type, expected) => {
            const { sql } = Expr.cast('code', type as any).toSql(dialect, 0);
            expect(sql).toBe(expected);
        });

        it('should cast with alias', () => {
            const { sql } = Expr.cast('id', 'text').as('id_text').toSql('postgres', 0);
            expect(sql).toBe('CAST("id" AS TEXT) AS "id_text"');
        });

        it('should cast expression (not just column)', () => {
            const inner = Expr.col('price').multiply(Expr.col('qty'));
            const { sql } = Expr.cast(inner, 'integer').toSql('postgres', 0);
            expect(sql).toBe('CAST(("price" * "qty") AS INTEGER)');
        });
    });

    // ─── ArithmeticExpr ────────────────────────────────────────

    describe('ArithmeticExpr', () => {
        it('should compile addition', () => {
            const { sql, params } = Expr.col('price').add(10).toSql('postgres', 0);
            expect(sql).toBe('("price" + $1)');
            expect(params).toEqual([10]);
        });

        it('should compile multiplication of two columns', () => {
            const { sql, params } = Expr.col('price').multiply(Expr.col('qty')).toSql('postgres', 0);
            expect(sql).toBe('("price" * "qty")');
            expect(params).toEqual([]);
        });

        it('should chain arithmetic', () => {
            const expr = Expr.col('price').multiply(Expr.col('qty')).add(Expr.col('tax'));
            const { sql } = expr.toSql('postgres', 0);
            expect(sql).toBe('(("price" * "qty") + "tax")');
        });

        it('should chain with numeric literal', () => {
            const expr = Expr.col('price').multiply(0.11).as('tax');
            const { sql, params } = expr.toSql('postgres', 0);
            expect(sql).toBe('("price" * $1) AS "tax"');
            expect(params).toEqual([0.11]);
        });

        it('should track param offsets across nested arithmetic', () => {
            const expr = Expr.col('a').add(5).subtract(3);
            const { sql, params } = expr.toSql('postgres', 0);
            expect(sql).toBe('(("a" + $1) - $2)');
            expect(params).toEqual([5, 3]);
        });

        it('should use ? for mysql params', () => {
            const expr = Expr.col('price').multiply(1.1);
            const { sql, params } = expr.toSql('mysql', 0);
            expect(sql).toBe('(`price` * ?)');
            expect(params).toEqual([1.1]);
        });

        it('should support static factory methods', () => {
            const { sql } = Expr.multiply('price', 2).toSql('postgres', 0);
            expect(sql).toBe('("price" * $1)');
        });
    });

    // ─── String Functions ──────────────────────────────────────

    describe('String Functions', () => {
        it('should compile UPPER', () => {
            const { sql } = Expr.upper('name').toSql('postgres', 0);
            expect(sql).toBe('UPPER("name")');
        });

        it('should compile LOWER', () => {
            const { sql } = Expr.lower('name').toSql('mysql', 0);
            expect(sql).toBe('LOWER(`name`)');
        });

        it('should compile TRIM', () => {
            const { sql } = Expr.trim('name').toSql('postgres', 0);
            expect(sql).toBe('TRIM("name")');
        });

        it('should compile LENGTH', () => {
            const { sql } = Expr.length('bio').toSql('postgres', 0);
            expect(sql).toBe('LENGTH("bio")');
        });

        it('should compile CONCAT with || for postgres', () => {
            const { sql, params } = Expr.concat(Expr.col('first'), Expr.val(' '), Expr.col('last'))
                .toSql('postgres', 0);
            expect(sql).toBe('"first" || $1 || "last"');
            expect(params).toEqual([' ']);
        });

        it('should compile CONCAT with CONCAT() for mysql', () => {
            const { sql, params } = Expr.concat(Expr.col('first'), Expr.val(' '), Expr.col('last'))
                .toSql('mysql', 0);
            expect(sql).toBe('CONCAT(`first`, ?, `last`)');
            expect(params).toEqual([' ']);
        });

        it('should compile SUBSTRING', () => {
            const { sql } = Expr.substring('email', 1, 3).toSql('postgres', 0);
            expect(sql).toBe('SUBSTRING("email", 1, 3)');
        });

        it('should compile REPLACE', () => {
            const { sql, params } = Expr.replace('name', 'old', 'new').toSql('postgres', 0);
            expect(sql).toBe('REPLACE("name", $1, $2)');
            expect(params).toEqual(['old', 'new']);
        });
    });

    // ─── Date Functions ────────────────────────────────────────

    describe('Date Functions', () => {
        it('should compile NOW() for postgres', () => {
            const { sql } = Expr.now().toSql('postgres', 0);
            expect(sql).toBe('NOW()');
        });

        it('should compile datetime(now) for sqlite', () => {
            const { sql } = Expr.now().toSql('sqlite', 0);
            expect(sql).toBe("datetime('now')");
        });

        it('should compile EXTRACT for postgres', () => {
            const { sql } = Expr.extract('year', 'created_at').toSql('postgres', 0);
            expect(sql).toBe('EXTRACT(YEAR FROM "created_at")');
        });

        it('should compile strftime for sqlite', () => {
            const { sql } = Expr.extract('year', 'created_at').toSql('sqlite', 0);
            expect(sql).toBe("CAST(strftime('%Y', \"created_at\") AS INTEGER)");
        });

        it('should compile EXTRACT month for mysql', () => {
            const { sql } = Expr.extract('month', 'created_at').toSql('mysql', 0);
            expect(sql).toBe('EXTRACT(MONTH FROM `created_at`)');
        });
    });

    // ─── Null Handling ─────────────────────────────────────────

    describe('Null Handling', () => {
        it('should compile COALESCE', () => {
            const { sql, params } = Expr.coalesce(Expr.col('nickname'), Expr.val('Anonymous'))
                .toSql('postgres', 0);
            expect(sql).toBe('COALESCE("nickname", $1)');
            expect(params).toEqual(['Anonymous']);
        });

        it('should compile COALESCE with multiple args', () => {
            const { sql, params } = Expr.coalesce(Expr.col('nick'), Expr.col('name'), Expr.val('N/A'))
                .toSql('postgres', 0);
            expect(sql).toBe('COALESCE("nick", "name", $1)');
            expect(params).toEqual(['N/A']);
        });

        it('should compile NULLIF', () => {
            const { sql, params } = Expr.nullIf('price', 0).toSql('postgres', 0);
            expect(sql).toBe('NULLIF("price", $1)');
            expect(params).toEqual([0]);
        });

        it('should compile ifNull (sugar for COALESCE with 2 args)', () => {
            const { sql, params } = Expr.ifNull('stock', 0).toSql('mysql', 0);
            expect(sql).toBe('COALESCE(`stock`, ?)');
            expect(params).toEqual([0]);
        });
    });

    // ─── Aggregates ────────────────────────────────────────────

    describe('Aggregates', () => {
        it('should compile COUNT(*)', () => {
            const { sql } = Expr.count().toSql('postgres', 0);
            expect(sql).toBe('COUNT(*)');
        });

        it('should compile COUNT(column)', () => {
            const { sql } = Expr.count('id').toSql('postgres', 0);
            expect(sql).toBe('COUNT("id")');
        });

        it('should compile COUNT(DISTINCT column)', () => {
            const { sql } = Expr.count('user_id').distinct().toSql('postgres', 0);
            expect(sql).toBe('COUNT(DISTINCT "user_id")');
        });

        it('should compile SUM', () => {
            const { sql } = Expr.sum('amount').as('total').toSql('postgres', 0);
            expect(sql).toBe('SUM("amount") AS "total"');
        });

        it('should compile AVG', () => {
            const { sql } = Expr.avg('rating').toSql('mysql', 0);
            expect(sql).toBe('AVG(`rating`)');
        });

        it('should compile SUM of expression', () => {
            const expr = Expr.sum(Expr.col('price').multiply(Expr.col('qty'))).as('revenue');
            const { sql } = expr.toSql('postgres', 0);
            expect(sql).toBe('SUM(("price" * "qty")) AS "revenue"');
        });
    });

    // ─── CaseWhen ──────────────────────────────────────────────

    describe('CaseWhenExpr', () => {
        it('should compile basic CASE WHEN', () => {
            const expr = Expr.caseWhen()
                .when('status', '=', 'paid', 'Completed')
                .when('status', '=', 'pending', 'Waiting')
                .else('Unknown');

            const { sql, params } = expr.toSql('postgres', 0);
            expect(sql).toBe(
                'CASE WHEN "status" = $1 THEN $2 WHEN "status" = $3 THEN $4 ELSE $5 END',
            );
            expect(params).toEqual(['paid', 'Completed', 'pending', 'Waiting', 'Unknown']);
        });

        it('should compile CASE WHEN with alias', () => {
            const { sql } = Expr.caseWhen()
                .when('active', '=', true, 'Yes')
                .else('No')
                .as('is_active')
                .toSql('postgres', 0);

            expect(sql).toContain('AS "is_active"');
        });

        it('should use mysql params', () => {
            const { sql, params } = Expr.caseWhen()
                .when('status', '=', 1, 'Active')
                .else('Inactive')
                .toSql('mysql', 0);

            expect(sql).toBe('CASE WHEN `status` = ? THEN ? ELSE ? END');
            expect(params).toEqual([1, 'Active', 'Inactive']);
        });
    });

    // ─── JSON ──────────────────────────────────────────────────

    describe('JsonExpr', () => {
        it('should compile JSON access for postgres', () => {
            const { sql } = Expr.jsonExtract('settings', 'theme').toSql('postgres', 0);
            expect(sql).toBe("\"settings\"->>'theme'");
        });

        it('should compile nested JSON for postgres', () => {
            const { sql } = Expr.jsonExtract('data', 'address.city').toSql('postgres', 0);
            expect(sql).toBe("\"data\"->'address'->>'city'");
        });

        it('should compile JSON_EXTRACT for mysql', () => {
            const { sql } = Expr.jsonExtract('settings', 'theme').toSql('mysql', 0);
            expect(sql).toBe("JSON_EXTRACT(`settings`, '$.theme')");
        });

        it('should compile json_extract for sqlite', () => {
            const { sql } = Expr.jsonExtract('settings', 'theme').toSql('sqlite', 0);
            expect(sql).toBe("json_extract(\"settings\", '$.theme')");
        });

        it('should compile nested JSON for mysql', () => {
            const { sql } = Expr.jsonExtract('data', 'address.city').toSql('mysql', 0);
            expect(sql).toBe("JSON_EXTRACT(`data`, '$.address.city')");
        });

        it('should compile JSON with alias', () => {
            const { sql } = Expr.jsonExtract('settings', 'theme').as('user_theme').toSql('postgres', 0);
            expect(sql).toBe("\"settings\"->>'theme' AS \"user_theme\"");
        });
    });

    // ─── SubQuery ──────────────────────────────────────────────

    describe('SubQueryExpr', () => {
        it('should wrap query as sub-expression', () => {
            const mockQb = { toSql: () => ({ sql: 'SELECT COUNT(*) FROM "orders"', params: [] }) };
            const { sql } = Expr.subQuery(mockQb).toSql('postgres', 0);
            expect(sql).toBe('(SELECT COUNT(*) FROM "orders")');
        });

        it('should support alias', () => {
            const mockQb = { toSql: () => ({ sql: 'SELECT 1', params: [] }) };
            const { sql } = Expr.subQuery(mockQb).as('cnt').toSql('postgres', 0);
            expect(sql).toBe('(SELECT 1) AS "cnt"');
        });
    });

    // ─── Complex Compositions ──────────────────────────────────

    describe('Complex Compositions', () => {
        it('should compose: CAST(uuid AS TEXT) with alias', () => {
            const { sql } = Expr.cast('id', 'text').as('id_text').toSql('postgres', 0);
            expect(sql).toBe('CAST("id" AS TEXT) AS "id_text"');
        });

        it('should compose: price * qty + tax as total', () => {
            const expr = Expr.col('price').multiply(Expr.col('qty')).add(Expr.col('tax')).as('total');
            const { sql } = expr.toSql('postgres', 0);
            expect(sql).toBe('(("price" * "qty") + "tax") AS "total"');
        });

        it('should compose: COALESCE with UPPER', () => {
            const expr = Expr.coalesce(Expr.upper('nickname'), Expr.col('name')).as('display');
            const { sql } = expr.toSql('postgres', 0);
            expect(sql).toBe('COALESCE(UPPER("nickname"), "name") AS "display"');
        });

        it('should compose: SUM(price * qty) with alias', () => {
            const expr = Expr.sum(Expr.col('price').multiply(Expr.col('qty'))).as('revenue');
            const { sql } = expr.toSql('mysql', 0);
            expect(sql).toBe('SUM((`price` * `qty`)) AS `revenue`');
        });

        it('should correctly track params across complex expression', () => {
            const expr = Expr.col('price')
                .multiply(Expr.col('qty'))
                .multiply(1.11)
                .add(5);

            const { sql, params } = expr.toSql('postgres', 0);
            expect(sql).toBe('((("price" * "qty") * $1) + $2)');
            expect(params).toEqual([1.11, 5]);
        });

        it('should correctly track params with offset', () => {
            const expr = Expr.col('price').add(10);
            // Simulating that 3 params already exist before this expression
            const { sql, params } = expr.toSql('postgres', 3);
            expect(sql).toBe('("price" + $4)');
            expect(params).toEqual([10]);
        });
    });
});
