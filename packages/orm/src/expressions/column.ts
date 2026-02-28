/**
 * @gao/orm — ColumnExpr
 *
 * Safe column reference with dialect-aware quoting.
 * Supports fluent chaining for arithmetic and aliasing.
 *
 * Note: cast() returns a CastExpr — use Expr.cast() directly to avoid
 * circular dependency. ColumnExpr focuses on arithmetic chaining.
 */

import type { Dialect, Expression, ExpressionResult } from './expression.js';
import { ExpressionCompiler } from './expression.js';
import { AliasExpr } from './alias.js';
import { ArithmeticExpr } from './arithmetic.js';
import { LiteralExpr } from './literal.js';

export class ColumnExpr implements Expression {
    constructor(private readonly column: string) { }

    toSql(dialect: Dialect, _paramOffset: number): ExpressionResult {
        return {
            sql: ExpressionCompiler.quoteIdentifier(this.column, dialect),
            params: [],
        };
    }

    // ─── Chainable ─────────────────────────────────────────────

    as(alias: string): AliasExpr {
        return new AliasExpr(this, alias);
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
}
