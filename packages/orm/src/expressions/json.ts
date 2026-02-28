/**
 * @gao/orm — JsonExpr
 *
 * Dialect-aware JSON field access.
 *
 * Expr.jsonExtract('settings', 'theme')
 *   Postgres → "settings"->>'theme'
 *   MySQL    → JSON_EXTRACT(`settings`, '$.theme')
 *   SQLite   → json_extract("settings", '$.theme')
 *
 * Nested paths: Expr.jsonExtract('data', 'address.city')
 *   Postgres → "data"->'address'->>'city'
 *   MySQL    → JSON_EXTRACT(`data`, '$.address.city')
 */

import type { Dialect, Expression, ExpressionResult } from './expression.js';
import { AliasExpr } from './alias.js';

/**
 * JSON field extraction — automatically chooses the right
 * operator/function per dialect.
 */
export class JsonExtractExpr implements Expression {
    constructor(
        private readonly expr: Expression,
        private readonly path: string,
        private readonly asText = true,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const inner = this.expr.toSql(dialect, paramOffset);

        if (dialect === 'postgres') {
            const segments = this.path.split('.');
            let sql = inner.sql;
            for (let i = 0; i < segments.length; i++) {
                const isLast = i === segments.length - 1;
                const op = isLast && this.asText ? '->>' : '->';
                sql += `${op}'${segments[i]!}'`;
            }
            return { sql, params: inner.params };
        }

        // MySQL, MariaDB, SQLite
        const fn = dialect === 'sqlite' ? 'json_extract' : 'JSON_EXTRACT';
        const jsonPath = `$.${this.path}`;
        return { sql: `${fn}(${inner.sql}, '${jsonPath}')`, params: inner.params };
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}

/**
 * JSON_CONTAINS / @> — check if JSON value contains something.
 * Postgres: col @> value::jsonb
 * MySQL/MariaDB: JSON_CONTAINS(col, value)
 */
export class JsonContainsExpr implements Expression {
    constructor(
        private readonly expr: Expression,
        private readonly value: unknown,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        const inner = this.expr.toSql(dialect, paramOffset);
        const jsonStr = JSON.stringify(this.value);

        if (dialect === 'postgres') {
            const param = `$${paramOffset + inner.params.length + 1}`;
            return { sql: `${inner.sql} @> ${param}::jsonb`, params: [...inner.params, jsonStr] };
        }

        // MySQL, MariaDB, SQLite
        const param = dialect === 'sqlite' ? '?' : '?';
        return { sql: `JSON_CONTAINS(${inner.sql}, ${param})`, params: [...inner.params, jsonStr] };
    }
}

/**
 * JSON sub-expression access — returns JSON (not text).
 * Used for nested traversal before final text extraction.
 */
export class JsonAccessExpr implements Expression {
    constructor(
        private readonly expr: Expression,
        private readonly path: string,
    ) { }

    toSql(dialect: Dialect, paramOffset: number): ExpressionResult {
        return new JsonExtractExpr(this.expr, this.path, false).toSql(dialect, paramOffset);
    }

    as(alias: string): AliasExpr { return new AliasExpr(this, alias); }
}
