/**
 * @gao/orm — String Function Expressions
 *
 * UPPER, LOWER, TRIM, LENGTH — UnaryFunctionExpr
 * CONCAT — dialect-aware (|| vs CONCAT())
 * SUBSTRING, REPLACE, LEFT, RIGHT
 */

import type { Dialect, Expression, ExpressionResult } from '../expression.js';
import { ExpressionCompiler } from '../expression.js';
import { AliasExpr } from '../alias.js';

/**
 * Generic single-argument SQL function.
 * Handles: UPPER(x), LOWER(x), TRIM(x), LENGTH(x)
 */
export class UnaryFunctionExpr implements Expression {
    constructor(
        private readonly fn: string,
        private readonly arg: Expression,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const inner = this.arg.toSql(dialect, paramOffset);
        return { sql: `${this.fn}(${inner.sql})`, params: inner.params };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}

/**
 * CONCAT — dialect-aware.
 * Postgres/SQLite: a || b || c
 * MySQL/MariaDB: CONCAT(a, b, c)
 */
export class ConcatExpr implements Expression {
    constructor(private readonly parts: Expression[]) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        let offset = paramOffset;
        const fragments: string[] = [];
        const allParams: unknown[] = [];

        for (const part of this.parts) {
            const compiled = part.toSql(dialect, offset);
            fragments.push(compiled.sql);
            allParams.push(...compiled.params);
            offset += compiled.params.length;
        }

        if (dialect === 'mysql' || dialect === 'mariadb') {
            return { sql: `CONCAT(${fragments.join(', ')})`, params: allParams };
        }
        // Postgres / SQLite use || operator
        return { sql: fragments.join(' || '), params: allParams };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}

/**
 * SUBSTRING(expr, start, length)
 */
export class SubstringExpr implements Expression {
    constructor(
        private readonly expr: Expression,
        private readonly start: number,
        private readonly length: number,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const inner = this.expr.toSql(dialect, paramOffset);
        return { sql: `SUBSTRING(${inner.sql}, ${this.start}, ${this.length})`, params: inner.params };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}

/**
 * REPLACE(expr, from, to) — all dialects support the same syntax.
 */
export class ReplaceExpr implements Expression {
    constructor(
        private readonly expr: Expression,
        private readonly from: string,
        private readonly to: string,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const inner = this.expr.toSql(dialect, paramOffset);
        const pFrom = ExpressionCompiler.formatParam(dialect, paramOffset + inner.params.length);
        const pTo = ExpressionCompiler.formatParam(dialect, paramOffset + inner.params.length + 1);
        return {
            sql: `REPLACE(${inner.sql}, ${pFrom}, ${pTo})`,
            params: [...inner.params, this.from, this.to],
        };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}
