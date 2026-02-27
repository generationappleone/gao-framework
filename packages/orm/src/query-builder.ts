/**
 * @gao/orm — Query Builder
 *
 * Fluent API for constructing type-safe parameterized SQL queries.
 * Prevents SQL injection by strictly using parameterized queries.
 */

import type { DatabaseDriver } from './drivers/driver.interface.js';
import type { PaginatedResult } from './pagination.js';
import type { ExecuteResult } from './types.js';

type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE' | 'ILIKE' | 'IN' | 'NOT IN' | 'IS' | 'IS NOT' | 'BETWEEN';

interface WhereClause {
  column: string;
  operator: Operator;
  value: unknown;
  boolean: 'AND' | 'OR';
  raw?: boolean;
}

interface HavingClause {
  column: string;
  operator: Operator;
  value: unknown;
}

interface JoinClause {
  table: string;
  first: string;
  operator: string;
  second: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS';
}

interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

export class QueryBuilder<TModel = any> {
  private _selects: string[] = ['*'];
  private _rawSelects: string[] = [];
  private _from = '';
  private _wheres: WhereClause[] = [];
  private _joins: JoinClause[] = [];
  private _orderBys: OrderByClause[] = [];
  private _groupBys: string[] = [];
  private _havings: HavingClause[] = [];
  private _limit?: number;
  private _offset?: number;

  constructor(
    private driver: DatabaseDriver,
    private dialect: 'sqlite' | 'postgres' | 'mysql' | 'mariadb' = 'postgres',
    tableName?: string,
  ) {
    if (tableName) {
      this._from = tableName;
    }
  }

  from(table: string): this {
    this._from = table;
    return this;
  }

  select(...columns: string[]): this {
    if (columns.length > 0) {
      this._selects = columns;
    }
    return this;
  }

  where(column: string, operatorOrValue: any, value?: any): this {
    if (value === undefined) {
      this._wheres.push({ column, operator: '=', value: operatorOrValue, boolean: 'AND' });
    } else {
      this._wheres.push({ column, operator: operatorOrValue as Operator, value, boolean: 'AND' });
    }
    return this;
  }

  orWhere(column: string, operatorOrValue: any, value?: any): this {
    if (value === undefined) {
      this._wheres.push({ column, operator: '=', value: operatorOrValue, boolean: 'OR' });
    } else {
      this._wheres.push({ column, operator: operatorOrValue as Operator, value, boolean: 'OR' });
    }
    return this;
  }

  join(
    table: string,
    first: string,
    operator: string,
    second: string,
    type: JoinClause['type'] = 'INNER',
  ): this {
    this._joins.push({ table, first, operator, second, type });
    return this;
  }

  leftJoin(table: string, first: string, operator: string, second: string): this {
    return this.join(table, first, operator, second, 'LEFT');
  }

  rightJoin(table: string, first: string, operator: string, second: string): this {
    return this.join(table, first, operator, second, 'RIGHT');
  }

  // ─── Extended WHERE Methods ────────────────────────────────────

  whereIn(column: string, values: unknown[]): this {
    if (values.length === 0) {
      // Empty array — always false
      this._wheres.push({ column: '1', operator: '=', value: 0, boolean: 'AND', raw: true });
      return this;
    }
    this._wheres.push({ column, operator: 'IN', value: values, boolean: 'AND' });
    return this;
  }

  whereNotIn(column: string, values: unknown[]): this {
    if (values.length === 0) return this; // NOT IN empty = no restriction
    this._wheres.push({ column, operator: 'NOT IN', value: values, boolean: 'AND' });
    return this;
  }

  whereNull(column: string): this {
    this._wheres.push({ column, operator: 'IS', value: null, boolean: 'AND' });
    return this;
  }

  whereNotNull(column: string): this {
    this._wheres.push({ column, operator: 'IS NOT', value: null, boolean: 'AND' });
    return this;
  }

  whereBetween(column: string, range: [unknown, unknown]): this {
    this._wheres.push({ column, operator: 'BETWEEN', value: range, boolean: 'AND' });
    return this;
  }

  whereRaw(sql: string, params: unknown[] = []): this {
    this._wheres.push({ column: sql, operator: '=' as Operator, value: params, boolean: 'AND', raw: true });
    return this;
  }

  orWhereIn(column: string, values: unknown[]): this {
    if (values.length === 0) return this;
    this._wheres.push({ column, operator: 'IN', value: values, boolean: 'OR' });
    return this;
  }

  // ─── Extended SELECT Methods ──────────────────────────────────

  selectRaw(...expressions: string[]): this {
    this._rawSelects.push(...expressions);
    return this;
  }

  // ─── GROUP BY / HAVING ────────────────────────────────────────

  groupBy(...columns: string[]): this {
    this._groupBys.push(...columns);
    return this;
  }

  having(column: string, operatorOrValue: any, value?: any): this {
    if (value === undefined) {
      this._havings.push({ column, operator: '=', value: operatorOrValue });
    } else {
      this._havings.push({ column, operator: operatorOrValue as Operator, value });
    }
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderBys.push({ column, direction });
    return this;
  }

  limit(limit: number): this {
    this._limit = limit;
    return this;
  }

  offset(offset: number): this {
    this._offset = offset;
    return this;
  }

  /**
   * Compile a SELECT query.
   */
  toSql(): { sql: string; params: unknown[] } {
    const params: unknown[] = [];

    // Build SELECT clause
    const selectParts: string[] = [];
    if (this._rawSelects.length > 0) {
      selectParts.push(...this._rawSelects);
      if (this._selects.length > 0 && !(this._selects.length === 1 && this._selects[0] === '*')) {
        selectParts.push(...this._selects);
      }
    } else {
      selectParts.push(...this._selects);
    }

    let sql = `SELECT ${selectParts.join(', ')} FROM ${this.quoteIdentifier(this._from)}`;

    for (const join of this._joins) {
      sql += ` ${join.type} JOIN ${this.quoteIdentifier(join.table)} ON ${this.quoteIdentifier(join.first)} ${join.operator} ${this.quoteIdentifier(join.second)}`;
    }

    sql += this.compileWheres(params);

    if (this._groupBys.length > 0) {
      const groupSql = this._groupBys.map((col) => this.quoteIdentifier(col)).join(', ');
      sql += ` GROUP BY ${groupSql}`;
    }

    if (this._havings.length > 0) {
      sql += ' HAVING ';
      this._havings.forEach((having, index) => {
        if (index > 0) sql += ' AND ';
        sql += `${this.quoteIdentifier(having.column)} ${having.operator} ${this.formatParam(params.length)}`;
        params.push(having.value);
      });
    }

    if (this._orderBys.length > 0) {
      const orderSql = this._orderBys
        .map((ob) => `${this.quoteIdentifier(ob.column)} ${ob.direction}`)
        .join(', ');
      sql += ` ORDER BY ${orderSql}`;
    }

    if (this._limit !== undefined) {
      sql += ` LIMIT ${this._limit}`;
    }

    if (this._offset !== undefined) {
      sql += ` OFFSET ${this._offset}`;
    }

    return { sql, params };
  }

  /**
   * Compile WHERE clauses into SQL string fragment and push params.
   */
  private compileWheres(params: unknown[]): string {
    if (this._wheres.length === 0) return '';

    let sql = ' WHERE ';
    this._wheres.forEach((where, index) => {
      if (index > 0) sql += ` ${where.boolean} `;

      if (where.raw) {
        // whereRaw — inject SQL directly, append params
        sql += where.column;
        if (Array.isArray(where.value) && (where.value as unknown[]).length > 0) {
          params.push(...(where.value as unknown[]));
        }
        return;
      }

      if (where.operator === 'IN' || where.operator === 'NOT IN') {
        const values = where.value as unknown[];
        const placeholders = values.map((_, i) => this.formatParam(params.length + i)).join(', ');
        sql += `${this.quoteIdentifier(where.column)} ${where.operator} (${placeholders})`;
        params.push(...values);
        return;
      }

      if (where.operator === 'IS' || where.operator === 'IS NOT') {
        sql += `${this.quoteIdentifier(where.column)} ${where.operator} NULL`;
        return;
      }

      if (where.operator === 'BETWEEN') {
        const range = where.value as [unknown, unknown];
        sql += `${this.quoteIdentifier(where.column)} BETWEEN ${this.formatParam(params.length)} AND ${this.formatParam(params.length + 1)}`;
        params.push(range[0], range[1]);
        return;
      }

      sql += `${this.quoteIdentifier(where.column)} ${where.operator} ${this.formatParam(params.length)}`;
      params.push(where.value);
    });

    return sql;
  }

  /**
   * Setup an INSERT query using the provided data.
   */
  compileInsert(data: Record<string, unknown>): { sql: string; params: unknown[] } {
    const columns = Object.keys(data);
    const params = Object.values(data);
    const placeholders = columns.map((_, i) => this.formatParam(i)).join(', ');

    const colsSql = columns.map((c) => this.quoteIdentifier(c)).join(', ');
    const sql = `INSERT INTO ${this.quoteIdentifier(this._from)} (${colsSql}) VALUES (${placeholders})`;

    return { sql, params };
  }

  /**
   * Setup an UPDATE query.
   */
  compileUpdate(data: Record<string, unknown>): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    const setSql = Object.entries(data)
      .map(([col, val]) => {
        params.push(val);
        return `${this.quoteIdentifier(col)} = ${this.formatParam(params.length - 1)}`;
      })
      .join(', ');

    let sql = `UPDATE ${this.quoteIdentifier(this._from)} SET ${setSql}`;
    sql += this.compileWheres(params);

    return { sql, params };
  }

  /**
   * Setup a DELETE query.
   */
  compileDelete(): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    let sql = `DELETE FROM ${this.quoteIdentifier(this._from)}`;
    sql += this.compileWheres(params);
    return { sql, params };
  }

  /**
   * Compile a batch INSERT query.
   */
  compileInsertMany(rows: Record<string, unknown>[]): { sql: string; params: unknown[] } {
    if (rows.length === 0) throw new Error('insertMany requires at least one row');
    const columns = Object.keys(rows[0]!);
    const params: unknown[] = [];
    const valueSets: string[] = [];

    for (const row of rows) {
      const placeholders = columns.map((col) => {
        params.push(row[col]);
        return this.formatParam(params.length - 1);
      });
      valueSets.push(`(${placeholders.join(', ')})`);
    }

    const colsSql = columns.map((c) => this.quoteIdentifier(c)).join(', ');
    const sql = `INSERT INTO ${this.quoteIdentifier(this._from)} (${colsSql}) VALUES ${valueSets.join(', ')}`;
    return { sql, params };
  }

  /**
   * Compile an UPSERT query (INSERT ... ON CONFLICT).
   */
  compileUpsert(
    data: Record<string, unknown>,
    conflictColumns: string[],
    updateColumns?: string[],
  ): { sql: string; params: unknown[] } {
    const { sql: insertSql, params } = this.compileInsert(data);
    const conflictCols = conflictColumns.map((c) => this.quoteIdentifier(c)).join(', ');

    const updateCols = updateColumns || Object.keys(data).filter((k) => !conflictColumns.includes(k));
    const updateSql = updateCols
      .map((col) => `${this.quoteIdentifier(col)} = EXCLUDED.${this.quoteIdentifier(col)}`)
      .join(', ');

    const sql = updateSql
      ? `${insertSql} ON CONFLICT (${conflictCols}) DO UPDATE SET ${updateSql}`
      : `${insertSql} ON CONFLICT (${conflictCols}) DO NOTHING`;

    return { sql, params };
  }

  // ─── Execute Methods ──────────────────────────────────────────

  async get(): Promise<TModel[]> {
    const { sql, params } = this.toSql();
    return this.driver.query<TModel>(sql, params);
  }

  async first(): Promise<TModel | null> {
    this.limit(1);
    const results = await this.get();
    return results[0] ?? null;
  }

  async paginate(page = 1, perPage = 15): Promise<PaginatedResult<TModel>> {
    const _originalSelects = this._selects;
    const _originalLimit = this._limit;
    const _originalOffset = this._offset;
    const _originalOrderBys = this._orderBys;

    // Count query
    this._selects = ['COUNT(*) as total'];
    this._limit = undefined;
    this._offset = undefined;
    this._orderBys = []; // Order by doesn't affect count

    const { sql: countSql, params: countParams } = this.toSql();
    const countResult = await this.driver.query<{ total: string | number }>(countSql, countParams);
    const totalRows = countResult[0]?.total ? Number(countResult[0]?.total) : 0;

    // Restore builder state
    this._selects = _originalSelects;
    this._limit = _originalLimit;
    this._offset = _originalOffset;
    this._orderBys = _originalOrderBys;

    // Actual query
    const currentPage = Math.max(1, page);
    const limit = Math.max(1, perPage);
    const offset = (currentPage - 1) * limit;

    this.limit(limit);
    this.offset(offset);

    const data = await this.get();

    const totalPages = Math.ceil(totalRows / limit);

    return {
      data,
      meta: {
        page: currentPage,
        perPage: limit,
        total: totalRows,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
      },
    };
  }

  async insert(data: Record<string, unknown>): Promise<ExecuteResult> {
    const { sql, params } = this.compileInsert(data);
    const finalSql = this.dialect === 'postgres' ? `${sql} RETURNING id` : sql;
    return this.driver.execute(finalSql, params);
  }

  async insertMany(rows: Record<string, unknown>[]): Promise<ExecuteResult> {
    const { sql, params } = this.compileInsertMany(rows);
    const finalSql = this.dialect === 'postgres' ? `${sql} RETURNING id` : sql;
    return this.driver.execute(finalSql, params);
  }

  async upsert(
    data: Record<string, unknown>,
    conflictColumns: string[],
    updateColumns?: string[],
  ): Promise<ExecuteResult> {
    const { sql, params } = this.compileUpsert(data, conflictColumns, updateColumns);
    const finalSql = this.dialect === 'postgres' ? `${sql} RETURNING id` : sql;
    return this.driver.execute(finalSql, params);
  }

  async update(data: Record<string, unknown>): Promise<ExecuteResult> {
    const { sql, params } = this.compileUpdate(data);
    return this.driver.execute(sql, params);
  }

  async increment(column: string, amount = 1): Promise<ExecuteResult> {
    const params: unknown[] = [amount];
    let sql = `UPDATE ${this.quoteIdentifier(this._from)} SET ${this.quoteIdentifier(column)} = ${this.quoteIdentifier(column)} + ${this.formatParam(0)}`;
    sql += this.compileWheres(params);
    return this.driver.execute(sql, params);
  }

  async decrement(column: string, amount = 1): Promise<ExecuteResult> {
    const params: unknown[] = [amount];
    let sql = `UPDATE ${this.quoteIdentifier(this._from)} SET ${this.quoteIdentifier(column)} = ${this.quoteIdentifier(column)} - ${this.formatParam(0)}`;
    sql += this.compileWheres(params);
    return this.driver.execute(sql, params);
  }

  async delete(): Promise<ExecuteResult> {
    const { sql, params } = this.compileDelete();
    return this.driver.execute(sql, params);
  }

  // ─── Aggregate Methods ────────────────────────────────────────

  async count(column = '*'): Promise<number> {
    const originalSelects = this._selects;
    const originalRawSelects = this._rawSelects;
    this._selects = [];
    this._rawSelects = [`COUNT(${column === '*' ? '*' : this.quoteIdentifier(column)}) as "aggregate"`];
    const { sql, params } = this.toSql();
    this._selects = originalSelects;
    this._rawSelects = originalRawSelects;
    const rows = await this.driver.query<{ aggregate: string | number }>(sql, params);
    return Number(rows[0]?.aggregate ?? 0);
  }

  async sum(column: string): Promise<number> {
    const originalSelects = this._selects;
    const originalRawSelects = this._rawSelects;
    this._selects = [];
    this._rawSelects = [`COALESCE(SUM(${this.quoteIdentifier(column)}), 0) as "aggregate"`];
    const { sql, params } = this.toSql();
    this._selects = originalSelects;
    this._rawSelects = originalRawSelects;
    const rows = await this.driver.query<{ aggregate: string | number }>(sql, params);
    return Number(rows[0]?.aggregate ?? 0);
  }

  async avg(column: string): Promise<number> {
    const originalSelects = this._selects;
    const originalRawSelects = this._rawSelects;
    this._selects = [];
    this._rawSelects = [`COALESCE(AVG(${this.quoteIdentifier(column)}), 0) as "aggregate"`];
    const { sql, params } = this.toSql();
    this._selects = originalSelects;
    this._rawSelects = originalRawSelects;
    const rows = await this.driver.query<{ aggregate: string | number }>(sql, params);
    return Number(rows[0]?.aggregate ?? 0);
  }

  async min(column: string): Promise<number> {
    const originalSelects = this._selects;
    const originalRawSelects = this._rawSelects;
    this._selects = [];
    this._rawSelects = [`MIN(${this.quoteIdentifier(column)}) as "aggregate"`];
    const { sql, params } = this.toSql();
    this._selects = originalSelects;
    this._rawSelects = originalRawSelects;
    const rows = await this.driver.query<{ aggregate: string | number }>(sql, params);
    return Number(rows[0]?.aggregate ?? 0);
  }

  async max(column: string): Promise<number> {
    const originalSelects = this._selects;
    const originalRawSelects = this._rawSelects;
    this._selects = [];
    this._rawSelects = [`MAX(${this.quoteIdentifier(column)}) as "aggregate"`];
    const { sql, params } = this.toSql();
    this._selects = originalSelects;
    this._rawSelects = originalRawSelects;
    const rows = await this.driver.query<{ aggregate: string | number }>(sql, params);
    return Number(rows[0]?.aggregate ?? 0);
  }

  async pluck<T = unknown>(column: string): Promise<T[]> {
    const originalSelects = this._selects;
    this._selects = [this.quoteIdentifier(column)];
    const { sql, params } = this.toSql();
    this._selects = originalSelects;
    const rows = await this.driver.query<Record<string, T>>(sql, params);
    return rows.map((row) => row[column] as T);
  }

  async exists(): Promise<boolean> {
    const originalSelects = this._selects;
    const originalRawSelects = this._rawSelects;
    const originalLimit = this._limit;
    this._selects = ['1'];
    this._rawSelects = [];
    this._limit = 1;
    const { sql, params } = this.toSql();
    this._selects = originalSelects;
    this._rawSelects = originalRawSelects;
    this._limit = originalLimit;
    const rows = await this.driver.query(sql, params);
    return rows.length > 0;
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private quoteIdentifier(identifier: string): string {
    // Protect from naive SQL injection in identifiers.
    // Identifiers shouldn't contain spaces or quotes unless properly escaped.
    // For simplicity, we wrap in double quotes.
    if (identifier.includes('.')) {
      return identifier
        .split('.')
        .map((part) => `"${part}"`)
        .join('.');
    }
    return `"${identifier}"`;
  }

  private formatParam(index: number): string {
    if (this.dialect === 'postgres') {
      return `$${index + 1}`;
    }
    return '?';
  }
}
