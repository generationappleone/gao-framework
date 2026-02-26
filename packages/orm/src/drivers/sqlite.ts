/**
 * @gao/orm — SQLite Driver
 *
 * SQLite driver implementation. Uses `better-sqlite3` under the hood
 * to provide a high-performance synchronous, but wrapped in promises for the async interface.
 */

import Database from 'better-sqlite3';
import type { ExecuteResult } from '../types.js';
import type { DatabaseDriver } from './driver.interface.js';

export interface SQLiteDriverOptions {
  /** Path to the SQLite database file or ':memory:' */
  filename: string;
  /** Additional options passed to better-sqlite3 */
  options?: Database.Options;
}

export class SQLiteDriver implements DatabaseDriver {
  private db: Database.Database | null = null;
  private isTransaction = false;
  private savepointDepth = 0;

  constructor(
    private config: SQLiteDriverOptions,
    db?: Database.Database,
    savepointDepth = 0,
  ) {
    if (db && !this.db) {
      this.db = db;
      this.isTransaction = true;
      this.savepointDepth = savepointDepth;
    }
  }

  async connect(): Promise<void> {
    if (this.db) return; // Already connected or shared

    // Emulate async connection even though it's sync in better-sqlite3
    this.db = new Database(this.config.filename, this.config.options);
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
  }

  async disconnect(): Promise<void> {
    if (!this.db || this.isTransaction) return; // Don't close if it's a shared transaction instance

    this.db.close();
    this.db = null;
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.ensureConnected();
    const stmt = this.db!.prepare(sql);
    // all() returns an array of objects
    return stmt.all(params) as T[];
  }

  async execute(sql: string, params: unknown[] = []): Promise<ExecuteResult> {
    this.ensureConnected();
    const stmt = this.db!.prepare(sql);
    const info = stmt.run(params);

    return {
      insertId: info.lastInsertRowid.toString(),
      rowsAffected: info.changes,
    };
  }

  async transaction<T>(callback: (trxDriver: DatabaseDriver) => Promise<T>): Promise<T> {
    this.ensureConnected();

    // If we are already in a transaction, just reuse the current driver
    if (this.isTransaction) {
      const savepointName = `sp_${this.savepointDepth + 1}`;
      (this.db as Database.Database).exec(`SAVEPOINT ${savepointName}`);

      try {
        const trxDriver = new SQLiteDriver(
          this.config,
          this.db as Database.Database,
          this.savepointDepth + 1,
        );
        const result = await callback(trxDriver);
        (this.db as Database.Database).exec(`RELEASE SAVEPOINT ${savepointName}`);
        return result;
      } catch (error) {
        (this.db as Database.Database).exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
        throw error;
      }
    }

    // better-sqlite3 uses synchronous transactions via `db.transaction()`
    // However, our callback is async. So we must BEGIN and COMMIT manually.
    // It's safe on a dedicated instance like memory or single file, but concurrency requires care.
    // Node.js event loop: manual BEGIN/COMMIT with async await can technically interleave if multiple
    // connections aren't separated. But better-sqlite3 is blocking.
    // A simple approach for this async driver:

    (this.db as Database.Database).exec('BEGIN TRANSACTION');

    try {
      // Provide a new driver instance that shares the db and knows it's a transaction
      const trxDriver = new SQLiteDriver(this.config, this.db as Database.Database);
      const result = await callback(trxDriver);
      (this.db as Database.Database).exec('COMMIT');
      return result;
    } catch (error) {
      (this.db as Database.Database).exec('ROLLBACK');
      throw error;
    }
  }

  getPool(): Database.Database | null {
    return this.db;
  }

  private ensureConnected() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }
}
