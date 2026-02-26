/**
 * @gao/orm — Types
 *
 * Core typings for the ORM layer.
 */

export interface QueryResult<T = unknown> {
  rows: T[];
}

export interface ExecuteResult {
  insertId?: number | string;
  rowsAffected: number;
}
