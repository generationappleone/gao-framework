/**
 * @gao/orm — Aggregate Expressions
 *
 * COUNT, SUM, AVG, MIN, MAX as expression objects.
 * Can be used in SELECT, HAVING, sub-queries, etc.
 *
 * Example: Expr.sum(Expr.col('price').multiply(Expr.col('qty'))).as('revenue')
 */

import type { Dialect, Expression, ExpressionResult } from '../expression.js';
import { AliasExpr } from '../alias.js';

export class AggregateExpr implements Expression {
    constructor(
        private readonly fn: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX',
        private readonly arg: Expression | '*',
        private readonly isDistinct = false,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        if (this.arg === '*') {
            return { sql: `${this.fn}(*)`, params: [] };
        }

        const inner = this.arg.toSql(dialect, paramOffset);
        const distinctFlag = this.isDistinct ? 'DISTINCT ' : '';
        return {
            sql: `${this.fn}(${distinctFlag}${inner.sql})`,
            params: inner.params,
        };
    }

    /** Return DISTINCT version of this aggregate. */
    distinct(): AggregateExpr {
        return new AggregateExpr(this.fn, this.arg, true);
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}
