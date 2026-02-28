/**
 * @gao/orm — Null Handling Expressions
 *
 * COALESCE(a, b, c) — returns first non-null value
 * NULLIF(a, b) — returns null if a = b
 */

import type { Dialect, Expression, ExpressionResult } from '../expression.js';
import { AliasExpr } from '../alias.js';

/**
 * COALESCE(arg1, arg2, ...) — returns the first non-null argument.
 * All dialects use the same syntax.
 */
export class CoalesceExpr implements Expression {
    constructor(private readonly args: Expression[]) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        let offset = paramOffset;
        const parts: string[] = [];
        const allParams: unknown[] = [];

        for (const arg of this.args) {
            const compiled = arg.toSql(dialect, offset);
            parts.push(compiled.sql);
            allParams.push(...compiled.params);
            offset += compiled.params.length;
        }

        return { sql: `COALESCE(${parts.join(', ')})`, params: allParams };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}

/**
 * NULLIF(a, b) — returns NULL if a equals b, otherwise returns a.
 */
export class NullIfExpr implements Expression {
    constructor(
        private readonly expr: Expression,
        private readonly compareValue: Expression,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const l = this.expr.toSql(dialect, paramOffset);
        const r = this.compareValue.toSql(dialect, paramOffset + l.params.length);
        return {
            sql: `NULLIF(${l.sql}, ${r.sql})`,
            params: [...l.params, ...r.params],
        };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}
