/**
 * @gao/orm — Query Builder
 *
 * Fluent API for constructing type-safe parameterized SQL queries.
 * Prevents SQL injection by strictly using parameterized queries.
 */

import type { DatabaseDriver } from './drivers/driver.interface.js';
import type { PaginatedResult } from './pagination.js';
import type { ExecuteResult } from './types.js';
import type { Expression, Dialect } from './expressions/expression.js';
import { isExpression } from './expressions/expression.js';

type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE' | 'ILIKE' | 'IN' | 'NOT IN' | 'IS' | 'IS NOT' | 'BETWEEN';

interface WhereClause {
  column: string | Expression;
  operator: Operator;
  value: unknown;
  boolean: 'AND' | 'OR';
  raw?: boolean;
}

interface HavingClause {
  column: string | Expression;
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
  column: string | Expression;
  direction: 'ASC' | 'DESC';
}

export class QueryBuilder<TModel = any> {
  private _selects: (string | Expression)[] = ['*'];
  private _rawSelects: string[] = [];
  private _from = '';
  private _wheres: WhereClause[] = [];
  private _joins: JoinClause[] = [];
  private _orderBys: OrderByClause[] = [];
  private _groupBys: string[] = [];
  private _havings: HavingClause[] = [];
  private _limit?: number;
  private _offset?: number;
  private _distinct = false;
  private _whereExists: { sql: string; params: unknown[]; not: boolean; boolean: 'AND' | 'OR' }[] = [];

  constructor(
    private driver: DatabaseDriver,
    private dialect: Dialect = 'postgres',
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

  select(...columns: (string | Expression)[]): this {
    if (columns.length > 0) {
      this._selects = columns;
    }
    return this;
  }

  where(column: string | Expression, operatorOrValue: any, value?: any): this {
    if (value === undefined) {
      this._wheres.push({ column, operator: '=', value: operatorOrValue, boolean: 'AND' });
    } else {
      this._wheres.push({ column, operator: operatorOrValue as Operator, value, boolean: 'AND' });
    }
    return this;
  }

  orWhere(column: string | Expression, operatorOrValue: any, value?: any): this {
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

  orWhereNull(column: string): this {
    this._wheres.push({ column, operator: 'IS', value: null, boolean: 'OR' });
    return this;
  }

  orWhereNotNull(column: string): this {
    this._wheres.push({ column, operator: 'IS NOT', value: null, boolean: 'OR' });
    return this;
  }

  /**
   * Compare two columns in a WHERE clause.
   * @example .whereColumn('updated_at', '>', 'created_at')
   */
  whereColumn(first: string, operatorOrSecond: string, second?: string): this {
    const op = second !== undefined ? operatorOrSecond : '=';
    const col2 = second !== undefined ? second : operatorOrSecond;
    // Use raw WHERE to inject column references directly (no parameterization — column names only)
    this._wheres.push({
      column: `${this.quoteIdentifier(first)} ${op} ${this.quoteIdentifier(col2)}`,
      operator: '=' as Operator,
      value: [],
      boolean: 'AND',
      raw: true,
    });
    return this;
  }

  /**
   * WHERE column LIKE pattern.
   */
  whereLike(column: string, pattern: string): this {
    this._wheres.push({ column, operator: 'LIKE', value: pattern, boolean: 'AND' });
    return this;
  }

  /**
   * WHERE column NOT LIKE pattern.
   */
  whereNotLike(column: string, pattern: string): this {
    this._wheres.push({ column, operator: 'NOT LIKE', value: pattern, boolean: 'AND' });
    return this;
  }

  /**
   * WHERE EXISTS (subquery).
   * @param callback Receives a fresh QueryBuilder to build the subquery.
   */
  whereExists(callback: (qb: QueryBuilder) => void): this {
    const subQb = new QueryBuilder(this.driver, this.dialect);
    callback(subQb);
    const { sql, params } = subQb.toSql();
    this._whereExists.push({ sql, params, not: false, boolean: 'AND' });
    return this;
  }

  /**
   * WHERE NOT EXISTS (subquery).
   */
  whereNotExists(callback: (qb: QueryBuilder) => void): this {
    const subQb = new QueryBuilder(this.driver, this.dialect);
    callback(subQb);
    const { sql, params } = subQb.toSql();
    this._whereExists.push({ sql, params, not: true, boolean: 'AND' });
    return this;
  }

  // ─── Extended SELECT Methods ──────────────────────────────────

  selectRaw(...expressions: string[]): this {
    this._rawSelects.push(...expressions);
    return this;
  }

  // ─── GROUP BY / HAVING ────────────────────────────────────────

  groupBy(...columns: (string | Expression)[]): this {
    this._groupBys.push(...columns as string[]);
    return this;
  }

  having(column: string | Expression, operatorOrValue: any, value?: any): this {
    if (value === undefined) {
      this._havings.push({ column, operator: '=', value: operatorOrValue });
    } else {
      this._havings.push({ column, operator: operatorOrValue as Operator, value });
    }
    return this;
  }

  orderBy(column: string | Expression, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderBys.push({ column, direction });
    return this;
  }

  /**
   * ORDER BY column DESC — shortcut for latest records.
   * @param column Column to sort by (default: 'created_at')
   */
  latest(column = 'created_at'): this {
    return this.orderBy(column, 'DESC');
  }

  /**
   * ORDER BY column ASC — shortcut for oldest records.
   * @param column Column to sort by (default: 'created_at')
   */
  oldest(column = 'created_at'): this {
    return this.orderBy(column, 'ASC');
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
   * Add DISTINCT to the SELECT clause.
   */
  distinct(): this {
    this._distinct = true;
    return this;
  }

  /**
   * Conditional clause — only applies the callback if the condition is truthy.
   * @example .when(searchTerm, (qb) => qb.where('name', 'LIKE', `%${searchTerm}%`))
   */
  when(condition: unknown, callback: (qb: this) => void): this {
    if (condition) {
      callback(this);
    }
    return this;
  }

  /**
   * Compile a SELECT query.
   */
  toSql(): { sql: string; params: unknown[] } {
    const params: unknown[] = [];

    // Build SELECT clause — resolve Expression objects
    const selectParts: string[] = [];
    if (this._rawSelects.length > 0) {
      selectParts.push(...this._rawSelects);
    }
    for (const sel of this._selects) {
      if (isExpression(sel)) {
        const result = sel.toSql(this.dialect, params.length);
        selectParts.push(result.sql);
        params.push(...result.params);
      } else if (sel === '*' && selectParts.length > 0) {
        // Skip default '*' when other selects exist
        continue;
      } else {
        // String selects are passed as-is — they may contain raw expressions
        // from internal callers (paginate, count, sum, etc.)
        selectParts.push(sel);
      }
    }
    if (selectParts.length === 0) {
      selectParts.push('*');
    }

    const distinctPrefix = this._distinct ? 'DISTINCT ' : '';
    let sql = `SELECT ${distinctPrefix}${selectParts.join(', ')} FROM ${this.quoteIdentifier(this._from)}`;

    for (const join of this._joins) {
      sql += ` ${join.type} JOIN ${this.quoteIdentifier(join.table)} ON ${this.quoteIdentifier(join.first)} ${join.operator} ${this.quoteIdentifier(join.second)}`;
    }

    sql += this.compileWheres(params);

    // Add WHERE EXISTS clauses
    for (const exist of this._whereExists) {
      const notKeyword = exist.not ? 'NOT ' : '';
      if (this._wheres.length === 0 && this._whereExists.indexOf(exist) === 0) {
        sql += ` WHERE ${notKeyword}EXISTS (${exist.sql})`;
      } else {
        sql += ` ${exist.boolean} ${notKeyword}EXISTS (${exist.sql})`;
      }
      params.push(...exist.params);
    }

    if (this._groupBys.length > 0) {
      const groupParts = this._groupBys.map((col) => {
        if (isExpression(col)) {
          const result = (col as unknown as Expression).toSql(this.dialect, params.length);
          params.push(...result.params);
          return result.sql;
        }
        return this.quoteIdentifier(col);
      });
      sql += ` GROUP BY ${groupParts.join(', ')}`;
    }

    if (this._havings.length > 0) {
      sql += ' HAVING ';
      this._havings.forEach((having, index) => {
        if (index > 0) sql += ' AND ';
        if (isExpression(having.column)) {
          const result = having.column.toSql(this.dialect, params.length);
          params.push(...result.params);
          sql += `${result.sql} ${having.operator} ${this.formatParam(params.length)}`;
        } else {
          sql += `${this.quoteIdentifier(having.column)} ${having.operator} ${this.formatParam(params.length)}`;
        }
        params.push(having.value);
      });
    }

    if (this._orderBys.length > 0) {
      const orderParts = this._orderBys.map((ob) => {
        if (isExpression(ob.column)) {
          const result = ob.column.toSql(this.dialect, params.length);
          params.push(...result.params);
          return `${result.sql} ${ob.direction}`;
        }
        return `${this.quoteIdentifier(ob.column)} ${ob.direction}`;
      });
      sql += ` ORDER BY ${orderParts.join(', ')}`;
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
        sql += where.column as string;
        if (Array.isArray(where.value) && (where.value as unknown[]).length > 0) {
          params.push(...(where.value as unknown[]));
        }
        return;
      }

      // Resolve the column — either an Expression or a quoted identifier
      let columnSql: string;
      if (isExpression(where.column)) {
        const result = where.column.toSql(this.dialect, params.length);
        columnSql = result.sql;
        params.push(...result.params);
      } else {
        columnSql = this.quoteIdentifier(where.column);
      }

      if (where.operator === 'IN' || where.operator === 'NOT IN') {
        const values = where.value as unknown[];
        const placeholders = values.map((_, i) => this.formatParam(params.length + i)).join(', ');
        sql += `${columnSql} ${where.operator} (${placeholders})`;
        params.push(...values);
        return;
      }

      if (where.operator === 'IS' || where.operator === 'IS NOT') {
        sql += `${columnSql} ${where.operator} NULL`;
        return;
      }

      if (where.operator === 'BETWEEN') {
        const range = where.value as [unknown, unknown];
        sql += `${columnSql} BETWEEN ${this.formatParam(params.length)} AND ${this.formatParam(params.length + 1)}`;
        params.push(range[0], range[1]);
        return;
      }

      sql += `${columnSql} ${where.operator} ${this.formatParam(params.length)}`;
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

  /**
   * Get a single column value from the first matching row.
   * @param column Column name to retrieve
   */
  async value<V = unknown>(column: string): Promise<V | null> {
    const originalSelects = this._selects;
    this._selects = [this.quoteIdentifier(column)];
    this.limit(1);
    const { sql, params } = this.toSql();
    this._selects = originalSelects;
    const rows = await this.driver.query<Record<string, V>>(sql, params);
    return rows[0]?.[column] ?? null;
  }

  /**
   * Process large result sets in chunks without memory overflow.
   * @param size Number of records per chunk
   * @param callback Function to process each chunk. Return false to stop iteration.
   */
  async chunk(size: number, callback: (rows: TModel[]) => Promise<void | boolean>): Promise<void> {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const originalLimit = this._limit;
      const originalOffset = this._offset;

      this._limit = size;
      this._offset = page * size;

      const { sql, params } = this.toSql();

      this._limit = originalLimit;
      this._offset = originalOffset;

      const rows = await this.driver.query<TModel>(sql, params);

      if (rows.length === 0) break;

      const result = await callback(rows);
      if (result === false) break;

      if (rows.length < size) break;
      page++;
    }
  }

  /**
   * Process large result sets in chunks by ID column with stable ordering.
   * @param size Number of records per chunk
   * @param callback Function to process each chunk
   * @param column Column to use for pagination (default: 'id')
   */
  async chunkById(
    size: number,
    callback: (rows: TModel[]) => Promise<void | boolean>,
    column = 'id',
  ): Promise<void> {
    let lastId: unknown = null;

    while (true) {
      const qb = new QueryBuilder<TModel>(this.driver, this.dialect, this._from);
      // Copy wheres
      (qb as any)._wheres = [...this._wheres];
      (qb as any)._joins = [...this._joins];

      if (lastId !== null) {
        qb.where(column, '>', lastId);
      }
      qb.orderBy(column, 'ASC').limit(size);

      const rows = await qb.get();
      if (rows.length === 0) break;

      const result = await callback(rows);
      if (result === false) break;

      lastId = (rows[rows.length - 1] as any)[column];
      if (rows.length < size) break;
    }
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
