/**
 * @gao/orm — CastExpr
 *
 * CAST(expression AS type) — dialect-aware type resolution.
 *
 * Expr.cast('id', 'text')
 *   Postgres → CAST("id" AS TEXT)
 *   MySQL    → CAST(`id` AS CHAR)
 *   SQLite   → CAST("id" AS TEXT)
 */

import type { CastType, Dialect, Expression, ExpressionResult } from './expression.js';
import { ExpressionCompiler } from './expression.js';
import { AliasExpr } from './alias.js';

export class CastExpr implements Expression {
    constructor(
        private readonly expr: Expression,
        private readonly targetType: CastType,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const inner = this.expr.toSql(dialect, paramOffset);
        const sqlType = ExpressionCompiler.resolveCastType(this.targetType, dialect);
        return {
            sql: `CAST(${inner.sql} AS ${sqlType})`,
            params: inner.params,
        };
    }

    as(alias: string): AliasExpr {
        return new AliasExpr(this, alias);
    }
}
