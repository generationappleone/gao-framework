/**
 * @gao/orm — Date Function Expressions
 *
 * NOW — dialect-aware (NOW() vs datetime('now'))
 * EXTRACT — dialect-aware (EXTRACT vs strftime)
 */

import type { Dialect, Expression, ExpressionResult } from '../expression.js';
import { AliasExpr } from '../alias.js';

export type DatePart = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'
    | 'dow' | 'doy' | 'week' | 'quarter';

/**
 * NOW() — returns the current timestamp.
 * Postgres/MySQL/MariaDB: NOW()
 * SQLite: datetime('now')
 */
export class NowExpr implements Expression {
    toSql(dialect: Dialect, _paramOffset: number): ExpressionResult {
        const sql = dialect === 'sqlite' ? "datetime('now')" : 'NOW()';
        return { sql, params: [] };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}

/**
 * EXTRACT(part FROM expr) — dialect-aware.
 * Postgres/MySQL/MariaDB: EXTRACT(YEAR FROM "col")
 * SQLite: CAST(strftime('%Y', "col") AS INTEGER)
 */
export class ExtractExpr implements Expression {
    constructor(
        private readonly part: DatePart,
        private readonly expr: Expression,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const inner = this.expr.toSql(dialect, paramOffset);

        if (dialect === 'sqlite') {
            const fmtMap: Record<DatePart, string> = {
                year: '%Y', month: '%m', day: '%d', hour: '%H',
                minute: '%M', second: '%S', dow: '%w', doy: '%j',
                week: '%W', quarter: '%m',
            };
            return {
                sql: `CAST(strftime('${fmtMap[this.part]}', ${inner.sql}) AS INTEGER)`,
                params: inner.params,
            };
        }

        return {
            sql: `EXTRACT(${this.part.toUpperCase()} FROM ${inner.sql})`,
            params: inner.params,
        };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}
