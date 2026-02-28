/**
 * @gao/orm — RawExpr
 *
 * Escape hatch — injects raw SQL as an expression.
 * Use sparingly; prefer typed expression classes for safety.
 */

import type { Dialect, Expression, ExpressionResult } from './expression.js';
import { AliasExpr } from './alias.js';

export class RawExpr implements Expression {
    constructor(
        private readonly sql: string,
        private readonly _params: unknown[] = [],
    ) { }

    toSql(_dialect: Dialect, _paramOffset: number): ExpressionResult {
        return { sql: this.sql, params: [...this._params] };
    }

    as(alias: string): AliasExpr {
        return new AliasExpr(this, alias);
    }
}
