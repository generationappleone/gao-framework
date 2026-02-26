/**
 * @gao/orm — Database Driver Interface
 *
 * Defines the contract that all database drivers (SQLite, PostgreSQL, MySQL) must implement.
 */

import type { ExecuteResult } from '../types.js';

export interface DatabaseDriver {
  /** Connect to the database and initialize connection pools. */
  connect(): Promise<void>;

  /** Gracefully close all connections in the pool. */
  disconnect(): Promise<void>;

  /**
   * Execute a read query (SELECT) and return rows.
   * @param sql Parameterized SQL query
   * @param params Bound parameters
   */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Execute a write operation (INSERT, UPDATE, DELETE).
   * @param sql Parameterized SQL query
   * @param params Bound parameters
   */
  execute(sql: string, params?: unknown[]): Promise<ExecuteResult>;

  /**
   * Execute a callback within an isolated transaction block.
   * The callback is provided a scoped driver instance that uses a single dedicated connection.
   * @param callback Function executing inside the transaction
   */
  transaction<T>(callback: (trxDriver: DatabaseDriver) => Promise<T>): Promise<T>;

  /**
   * Optional accessor to the underlying connection pool or native client.
   */
  getPool?(): unknown;
}
