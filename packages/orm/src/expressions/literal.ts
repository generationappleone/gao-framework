/**
 * @gao/orm — LiteralExpr
 *
 * A parameterized literal value. NEVER injected directly into SQL.
 * Always uses $1/? placeholders to prevent SQL injection.
 */

import type { Dialect, Expression, ExpressionResult } from './expression.js';
import { ExpressionCompiler } from './expression.js';

export class LiteralExpr implements Expression {
    constructor(private readonly value: unknown) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        return {
            sql: ExpressionCompiler.formatParam(dialect, paramOffset),
            params: [this.value],
        };
    }
}
