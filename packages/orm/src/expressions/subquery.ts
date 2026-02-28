/**
 * @gao/orm — SubQueryExpr
 *
 * Wraps a QueryBuilder's output as a sub-expression.
 * Example:
 *   Expr.subQuery(
 *     new QueryBuilder(driver, dialect, 'orders')
 *       .select(Expr.count('*'))
 *       .where('user_id', Expr.col('users.id'))
 *   ).as('order_count')
 */

import type { Dialect, Expression, ExpressionResult } from './expression.js';
import { AliasExpr } from './alias.js';

export class SubQueryExpr implements Expression {
    constructor(
        private readonly queryBuilder: { toSql(): { sql: string; params: unknown[] } },
    ) { }

    toSql(_dialect: Dialect, _paramOffset: number): ExpressionResult {
        const { sql, params } = this.queryBuilder.toSql();
        return { sql: `(${sql})`, params };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}
