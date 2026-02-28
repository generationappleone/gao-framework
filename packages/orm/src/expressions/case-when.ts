/**
 * @gao/orm — CaseWhenExpr
 *
 * CASE WHEN condition THEN result [WHEN ... THEN ...] [ELSE default] END
 *
 * Example:
 *   Expr.caseWhen()
 *     .when(Expr.col('status'), '=', 'paid', 'Completed')
 *     .when(Expr.col('status'), '=', 'pending', 'Waiting')
 *     .else('Unknown')
 *     .as('status_label')
 */

import type { Dialect, Expression, ExpressionResult } from './expression.js';
import { isExpression } from './expression.js';
import { LiteralExpr } from './literal.js';
import { ColumnExpr } from './column.js';
import { AliasExpr } from './alias.js';

interface CaseWhenBranch {
    condition: Expression;
    operator: string;
    compareValue: Expression;
    result: Expression;
}

export class CaseWhenExpr implements Expression {
    private branches: CaseWhenBranch[] = [];
    private elseResult?: Expression;

    /**
     * Add a WHEN branch.
     * @param col Column or expression for the condition
     * @param op Comparison operator
     * @param compareValue Value to compare against
     * @param result Value to return if condition is true
     */
    when(
        col: Expression | string,
        op: string,
        compareValue: unknown,
        result: unknown,
    ): this {
        this.branches.push({
            condition: typeof col === 'string' ? new ColumnExpr(col) : col,
            operator: op,
            compareValue: isExpression(compareValue) ? compareValue : new LiteralExpr(compareValue),
            result: isExpression(result) ? result : new LiteralExpr(result),
        });
        return this;
    }

    /** Set the ELSE branch. */
    else(result: unknown): this {
        this.elseResult = isExpression(result) ? result : new LiteralExpr(result);
        return this;
    }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        let offset = paramOffset;
        const parts: string[] = ['CASE'];
        const allParams: unknown[] = [];

        for (const branch of this.branches) {
            const cond = branch.condition.toSql(dialect, offset);
            offset += cond.params.length;
            const cmp = branch.compareValue.toSql(dialect, offset);
            offset += cmp.params.length;
            const res = branch.result.toSql(dialect, offset);
            offset += res.params.length;

            parts.push(`WHEN ${cond.sql} ${branch.operator} ${cmp.sql} THEN ${res.sql}`);
            allParams.push(...cond.params, ...cmp.params, ...res.params);
        }

        if (this.elseResult) {
            const el = this.elseResult.toSql(dialect, offset);
            parts.push(`ELSE ${el.sql}`);
            allParams.push(...el.params);
        }

        parts.push('END');
        return { sql: parts.join(' '), params: allParams };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}
