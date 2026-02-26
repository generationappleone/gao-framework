/**
 * @gao/orm — Query Builder
 *
 * Fluent API for constructing type-safe parameterized SQL queries.
 * Prevents SQL injection by strictly using parameterized queries.
 */

import type { DatabaseDriver } from './drivers/driver.interface.js';
import type { PaginatedResult } from './pagination.js';
import type { ExecuteResult } from './types.js';

type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS' | 'IS NOT';

interface WhereClause {
  column: string;
  operator: Operator;
  value: unknown;
  boolean: 'AND' | 'OR';
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
  private _from = '';
  private _wheres: WhereClause[] = [];
  private _joins: JoinClause[] = [];
  private _orderBys: OrderByClause[] = [];
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
    let sql = `SELECT ${this._selects.join(', ')} FROM ${this.quoteIdentifier(this._from)}`;

    for (const join of this._joins) {
      sql += ` ${join.type} JOIN ${this.quoteIdentifier(join.table)} ON ${this.quoteIdentifier(join.first)} ${join.operator} ${this.quoteIdentifier(join.second)}`;
    }

    if (this._wheres.length > 0) {
      sql += ' WHERE ';
      this._wheres.forEach((where, index) => {
        if (index > 0) sql += ` ${where.boolean} `;
        sql += `${this.quoteIdentifier(where.column)} ${where.operator} ${this.formatParam(params.length)}`;
        params.push(where.value);
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

    if (this._wheres.length > 0) {
      sql += ' WHERE ';
      this._wheres.forEach((where, index) => {
        if (index > 0) sql += ` ${where.boolean} `;
        sql += `${this.quoteIdentifier(where.column)} ${where.operator} ${this.formatParam(params.length)}`;
        params.push(where.value);
      });
    }

    return { sql, params };
  }

  /**
   * Setup a DELETE query.
   */
  compileDelete(): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    let sql = `DELETE FROM ${this.quoteIdentifier(this._from)}`;

    if (this._wheres.length > 0) {
      sql += ' WHERE ';
      this._wheres.forEach((where, index) => {
        if (index > 0) sql += ` ${where.boolean} `;
        sql += `${this.quoteIdentifier(where.column)} ${where.operator} ${this.formatParam(params.length)}`;
        params.push(where.value);
      });
    }

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
    // Add RETURNING id for postgres if needed
    const finalSql = this.dialect === 'postgres' ? `${sql} RETURNING id` : sql;
    return this.driver.execute(finalSql, params);
  }

  async update(data: Record<string, unknown>): Promise<ExecuteResult> {
    const { sql, params } = this.compileUpdate(data);
    return this.driver.execute(sql, params);
  }

  async delete(): Promise<ExecuteResult> {
    const { sql, params } = this.compileDelete();
    return this.driver.execute(sql, params);
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
