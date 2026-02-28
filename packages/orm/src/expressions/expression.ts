/**
 * @gao/orm — Expression System
 *
 * Core Expression interface and compiler utilities.
 * Every SQL expression in the ORM implements the Expression interface.
 * Expressions compile to dialect-aware, parameterized SQL fragments.
 */

// ─── Types ─────────────────────────────────────────────────────

/** Database dialect — must match QueryBuilder's dialect */
export type Dialect = 'postgres' | 'mysql' | 'mariadb' | 'sqlite';

/** SQL CAST target types with dialect-aware resolution */
export type CastType =
    | 'text' | 'varchar' | 'integer' | 'bigint'
    | 'float' | 'double' | 'decimal'
    | 'boolean' | 'date' | 'timestamp'
    | 'json' | 'uuid';

/** Result of compiling an expression */
export interface ExpressionResult {
    /** SQL fragment (e.g., `CAST("id" AS TEXT)`) */
    sql: string;
    /** Bound parameter values */
    params: unknown[];
}

// ─── Core Interface ────────────────────────────────────────────

/**
 * Every SQL expression MUST implement this interface.
 * The `toSql()` method receives the dialect and current parameter offset,
 * returning the compiled SQL fragment and any bound parameters.
 */
export interface Expression {
    toSql(dialect: Dialect, paramOffset: number): ExpressionResult;
}

/**
 * Type guard — checks if a value is an Expression object.
 * Used by QueryBuilder to distinguish string column names from Expression objects.
 */
export function isExpression(value: unknown): value is Expression {
    return (
        typeof value === 'object' &&
        value !== null &&
        'toSql' in value &&
        typeof (value as any).toSql === 'function'
    );
}

// ─── Compiler Utilities ────────────────────────────────────────

export class ExpressionCompiler {
    /**
     * Quote an identifier based on dialect.
     * PostgreSQL/SQLite → "col", MySQL/MariaDB → `col`
     */
    static quoteIdentifier(identifier: string, dialect: Dialect): string {
        const q = dialect === 'mysql' || dialect === 'mariadb' ? '`' : '"';
        if (identifier === '*') return '*';
        if (identifier.includes('.')) {
            return identifier.split('.').map((p) => `${q}${p}${q}`).join('.');
        }
        return `${q}${identifier}${q}`;
    }

    /**
     * Format a parameter placeholder.
     * PostgreSQL → $1, $2, ... | MySQL/MariaDB/SQLite → ?
     */
    static formatParam(dialect: Dialect, offset: number): string {
        return dialect === 'postgres' ? `$${offset + 1}` : '?';
    }

    /**
     * Resolve a CastType to the correct SQL type string for the dialect.
     */
    static resolveCastType(type: CastType, dialect: Dialect): string {
        const map: Record<CastType, Record<Dialect, string>> = {
            text: { postgres: 'TEXT', mysql: 'CHAR', mariadb: 'CHAR', sqlite: 'TEXT' },
            varchar: { postgres: 'VARCHAR', mysql: 'CHAR', mariadb: 'CHAR', sqlite: 'TEXT' },
            integer: { postgres: 'INTEGER', mysql: 'SIGNED', mariadb: 'SIGNED', sqlite: 'INTEGER' },
            bigint: { postgres: 'BIGINT', mysql: 'SIGNED', mariadb: 'SIGNED', sqlite: 'INTEGER' },
            float: { postgres: 'FLOAT', mysql: 'DECIMAL(10,2)', mariadb: 'DECIMAL(10,2)', sqlite: 'REAL' },
            double: { postgres: 'DOUBLE PRECISION', mysql: 'DECIMAL(20,6)', mariadb: 'DECIMAL(20,6)', sqlite: 'REAL' },
            decimal: { postgres: 'DECIMAL', mysql: 'DECIMAL', mariadb: 'DECIMAL', sqlite: 'REAL' },
            boolean: { postgres: 'BOOLEAN', mysql: 'UNSIGNED', mariadb: 'UNSIGNED', sqlite: 'INTEGER' },
            date: { postgres: 'DATE', mysql: 'DATE', mariadb: 'DATE', sqlite: 'TEXT' },
            timestamp: { postgres: 'TIMESTAMP', mysql: 'DATETIME', mariadb: 'DATETIME', sqlite: 'TEXT' },
            json: { postgres: 'JSONB', mysql: 'JSON', mariadb: 'JSON', sqlite: 'TEXT' },
            uuid: { postgres: 'UUID', mysql: 'CHAR(36)', mariadb: 'CHAR(36)', sqlite: 'TEXT' },
        };
        return map[type][dialect];
    }
}
