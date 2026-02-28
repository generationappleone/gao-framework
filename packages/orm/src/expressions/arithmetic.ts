/**
 * @gao/orm — ArithmeticExpr
 *
 * Binary arithmetic: left OP right.
 * Supports chaining: Expr.col('price').multiply(Expr.col('qty')).add(10)
 * Output is always parenthesized for operator precedence safety.
 */

import type { Dialect, Expression, ExpressionResult } from './expression.js';
import { LiteralExpr } from './literal.js';
import { AliasExpr } from './alias.js';

export type ArithmeticOp = '+' | '-' | '*' | '/' | '%';

export class ArithmeticExpr implements Expression {
    constructor(
        private readonly left: Expression,
        private readonly op: ArithmeticOp,
        private readonly right: Expression,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const l = this.left.toSql(dialect, paramOffset);
        const r = this.right.toSql(dialect, paramOffset + l.params.length);
        return {
            sql: `(${l.sql} ${this.op} ${r.sql})`,
            params: [...l.params, ...r.params],
        };
    }

    add(right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(this, '+', typeof right === 'number' ? new LiteralExpr(right) : right);
    }
    subtract(right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(this, '-', typeof right === 'number' ? new LiteralExpr(right) : right);
    }
    multiply(right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(this, '*', typeof right === 'number' ? new LiteralExpr(right) : right);
    }
    divide(right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(this, '/', typeof right === 'number' ? new LiteralExpr(right) : right);
    }
    modulo(right: Expression | number): ArithmeticExpr {
        return new ArithmeticExpr(this, '%', typeof right === 'number' ? new LiteralExpr(right) : right);
    }

    as(alias: string): AliasExpr {
        return new AliasExpr(this, alias);
    }
}
