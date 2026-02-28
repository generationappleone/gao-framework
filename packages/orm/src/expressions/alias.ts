/**
 * @gao/orm — AliasExpr
 *
 * Wraps any expression with an AS "alias" clause.
 * Example: Expr.col('price').multiply(Expr.col('qty')).as('total')
 *   → ("price" * "qty") AS "total"
 */

import type { Dialect, Expression, ExpressionResult } from './expression.js';
import { ExpressionCompiler } from './expression.js';

export class AliasExpr implements Expression {
    constructor(
        private readonly expr: Expression,
        private readonly alias: string,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const inner = this.expr.toSql(dialect, paramOffset);
        return {
            sql: `${inner.sql} AS ${ExpressionCompiler.quoteIdentifier(this.alias, dialect)}`,
            params: inner.params,
        };
    }
}
