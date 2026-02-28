/**
 * @gao/orm — Expr Static Factory
 *
 * The main entry point for all OOP SQL expressions.
 * Provides a clean, discoverable API surface.
 *
 * Usage:
 *   import { Expr } from '@gao/orm';
 *
 *   Expr.col('name')
 *   Expr.cast('id', 'text')
 *   Expr.col('price').multiply(Expr.col('qty')).as('total')
 *   Expr.coalesce(Expr.col('nickname'), 'Anonymous')
 *   Expr.caseWhen().when('status', '=', 'active', 'Yes').else('No')
 *   Expr.jsonExtract('settings', 'theme')
 *   Expr.sum('amount').as('total')
 *   Expr.now()
 *   Expr.extract('year', 'created_at')
 */

import type { CastType, Expression } from './expression.js';
import { isExpression } from './expression.js';
import { ColumnExpr } from './column.js';
import { LiteralExpr } from './literal.js';
import { RawExpr } from './raw.js';
import { CastExpr } from './cast.js';
import { ArithmeticExpr } from './arithmetic.js';
import { ConcatExpr, ReplaceExpr, SubstringExpr, UnaryFunctionExpr } from './functions/string.js';
import type { DatePart } from './functions/date.js';
import { ExtractExpr, NowExpr } from './functions/date.js';
import { CoalesceExpr, NullIfExpr } from './functions/null-handling.js';
import { AggregateExpr } from './functions/aggregate.js';
import { CaseWhenExpr } from './case-when.js';
import { JsonContainsExpr, JsonExtractExpr } from './json.js';
import { SubQueryExpr } from './subquery.js';

/** Helper — resolve string column names to ColumnExpr */
function resolveExpr(value: Expression | string): Expression {
    return typeof value === 'string' ? new ColumnExpr(value) : value;
}

/** Helper — resolve value to Expression */
function resolveValue(value: unknown): Expression {
    return isExpression(value) ? value : new LiteralExpr(value);
}

export class Expr {
    // ─── Core ──────────────────────────────────────────────────

    /** Column reference — quoted per dialect. */
    static col(name: string): ColumnExpr {
        return new ColumnExpr(name);
    }

    /** Parameterized literal value — always uses $1/?. */
    static val(value: unknown): LiteralExpr {
        return new LiteralExpr(value);
    }

    /** Raw SQL — escape hatch. Use sparingly. */
    static raw(sql: string, params: unknown[] = []): RawExpr {
        return new RawExpr(sql, params);
    }

    // ─── Type Casting ──────────────────────────────────────────

    /** CAST(column AS type) — dialect-aware type mapping. */
    static cast(column: string | Expression, type: CastType): CastExpr {
        return new CastExpr(resolveExpr(column), type);
    }

    // ─── Arithmetic ────────────────────────────────────────────

    static add(left: Expression | string, right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(resolveExpr(left), '+', typeof right === 'number' ? new LiteralExpr(right) : right);
    }

    static subtract(left: Expression | string, right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(resolveExpr(left), '-', typeof right === 'number' ? new LiteralExpr(right) : right);
    }

    static multiply(left: Expression | string, right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(resolveExpr(left), '*', typeof right === 'number' ? new LiteralExpr(right) : right);
    }

    static divide(left: Expression | string, right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(resolveExpr(left), '/', typeof right === 'number' ? new LiteralExpr(right) : right);
    }

    static modulo(left: Expression | string, right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(resolveExpr(left), '%', typeof right === 'number' ? new LiteralExpr(right) : right);
    }

    // ─── String Functions ──────────────────────────────────────

    static upper(expr: Expression | string): UnaryFunctionExpr {
        return new UnaryFunctionExpr('UPPER', resolveExpr(expr));
    }

    static lower(expr: Expression | string): UnaryFunctionExpr {
        return new UnaryFunctionExpr('LOWER', resolveExpr(expr));
    }

    static trim(expr: Expression | string): UnaryFunctionExpr {
        return new UnaryFunctionExpr('TRIM', resolveExpr(expr));
    }

    static length(expr: Expression | string): UnaryFunctionExpr {
        return new UnaryFunctionExpr('LENGTH', resolveExpr(expr));
    }

    /** CONCAT — dialect-aware (|| for PG/SQLite, CONCAT() for MySQL). */
    static concat(...parts: (Expression | string)[]): ConcatExpr {
        return new ConcatExpr(parts.map((p) => typeof p === 'string' ? new LiteralExpr(p) : p));
    }

    /** CONCAT columns directly (no parameterization — for column references). */
    static concatColumns(...columns: string[]): ConcatExpr {
        return new ConcatExpr(columns.map((c) => new ColumnExpr(c)));
    }

    static substring(expr: Expression | string, start: number, length: number): SubstringExpr {
        return new SubstringExpr(resolveExpr(expr), start, length);
    }

    static replace(expr: Expression | string, from: string, to: string): ReplaceExpr {
        return new ReplaceExpr(resolveExpr(expr), from, to);
    }

    // ─── Date Functions ────────────────────────────────────────

    /** Current timestamp — NOW() or datetime('now'). */
    static now(): NowExpr {
        return new NowExpr();
    }

    /** EXTRACT(part FROM column) — dialect-aware. */
    static extract(part: DatePart, expr: Expression | string): ExtractExpr {
        return new ExtractExpr(part, resolveExpr(expr));
    }

    // ─── Null Handling ─────────────────────────────────────────

    /** COALESCE(a, b, c) — returns first non-null. */
    static coalesce(...args: (Expression | unknown)[]): CoalesceExpr {
        return new CoalesceExpr(args.map(resolveValue));
    }

    /** NULLIF(a, b) — returns null if a = b. */
    static nullIf(expr: Expression | string, compareValue: unknown): NullIfExpr {
        return new NullIfExpr(resolveExpr(expr), resolveValue(compareValue));
    }

    /** COALESCE(expr, default) — alias for ifNull/coalesce with 2 args. */
    static ifNull(expr: Expression | string, defaultValue: unknown): CoalesceExpr {
        return new CoalesceExpr([resolveExpr(expr), resolveValue(defaultValue)]);
    }

    // ─── Aggregates ────────────────────────────────────────────

    static count(arg: Expression | string | '*' = '*'): AggregateExpr {
        if (arg === '*') return new AggregateExpr('COUNT', '*');
        return new AggregateExpr('COUNT', resolveExpr(arg));
    }

    static sum(arg: Expression | string): AggregateExpr {
        return new AggregateExpr('SUM', resolveExpr(arg));
    }

    static avg(arg: Expression | string): AggregateExpr {
        return new AggregateExpr('AVG', resolveExpr(arg));
    }

    static min(arg: Expression | string): AggregateExpr {
        return new AggregateExpr('MIN', resolveExpr(arg));
    }

    static max(arg: Expression | string): AggregateExpr {
        return new AggregateExpr('MAX', resolveExpr(arg));
    }

    // ─── Conditional ───────────────────────────────────────────

    /** Start building a CASE WHEN expression. */
    static caseWhen(): CaseWhenExpr {
        return new CaseWhenExpr();
    }

    // ─── JSON ──────────────────────────────────────────────────

    /** JSON field extraction — dialect-aware. */
    static jsonExtract(expr: Expression | string, path: string): JsonExtractExpr {
        return new JsonExtractExpr(resolveExpr(expr), path);
    }

    /** JSON contains check — @> (PG) or JSON_CONTAINS (MySQL). */
    static jsonContains(expr: Expression | string, value: unknown): JsonContainsExpr {
        return new JsonContainsExpr(resolveExpr(expr), value);
    }

    // ─── Sub-query ─────────────────────────────────────────────

    /** Wrap a QueryBuilder as a sub-expression. */
    static subQuery(qb: { toSql(): { sql: string; params: unknown[] } }): SubQueryExpr {
        return new SubQueryExpr(qb);
    }
}
