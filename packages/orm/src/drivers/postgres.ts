/**
 * @gao/orm — PostgreSQL Driver
 *
 * PostgreSQL driver implementation. Uses `pg` under the hood
 * to provide a high-performance asynchronous interface connected via a connection pool.
 */

import pkg from 'pg';
const { Pool } = pkg;
import type { ExecuteResult } from '../types.js';
import type { DatabaseDriver } from './driver.interface.js';

export interface PostgresDriverOptions {
  /** Connection URI, e.g., postgresql://user:password@localhost:5432/mydb */
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  /** Max connections in the pool */
  max?: number;
  /** How long a client is allowed to remain idle before being closed */
  idleTimeoutMillis?: number;
  /** How long to wait when checking out a client from pool */
  connectionTimeoutMillis?: number;
}

export class PostgresDriver implements DatabaseDriver {
  private pool: pkg.Pool | null = null;
  private client: pkg.PoolClient | null = null;
  private isTransaction = false;
  private savepointDepth = 0;

  constructor(
    private config: PostgresDriverOptions,
    client?: pkg.PoolClient,
    savepointDepth = 0,
  ) {
    if (client) {
      this.client = client;
      this.isTransaction = true;
      this.savepointDepth = savepointDepth;
    }
  }

  async connect(): Promise<void> {
    if (this.pool || this.client) return; // Already connected or we are a transaction driver
    this.pool = new Pool(this.config);

    // Ensure connection works
    const client = await this.pool.connect();
    client.release();
  }

  async disconnect(): Promise<void> {
    if (this.isTransaction) return; // Managed by the transaction wrapper
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.ensureConnected();

    // Parameterizing for Postgres requires $1, $2, etc instead of ?.
    // This translation is assumed to be handled by the query builder before calling driver,
    // or the user should use $1 for native manual queries. We will just pass the SQL as is.
    // It's the ORM QueryBuilder’s responsibility to output the correct dialect placeholders.

    if (this.isTransaction && this.client) {
      const { rows } = await this.client.query(sql, params);
      return rows as T[];
    }

    const { rows } = await (this.pool as pkg.Pool).query(sql, params);
    return rows as T[];
  }

  async execute(sql: string, params: unknown[] = []): Promise<ExecuteResult> {
    this.ensureConnected();

    let result: pkg.QueryResult;

    if (this.isTransaction && this.client) {
      result = await this.client.query(sql, params);
    } else {
      result = await (this.pool as pkg.Pool).query(sql, params);
    }

    // Handle insertId. In Postgres standard INSERT returning ID is the convention (`RETURNING id`).
    // If the query returns rows, we take the first assumed ID.
    let insertId: string | number | undefined = undefined;
    if (result.rows.length > 0 && result.rows[0]) {
      // Usually we'd map this explicitly if RETURNING is used. Try to infer an id if it exists.
      insertId = result.rows[0].id;
    }

    return {
      insertId,
      rowsAffected: result.rowCount ?? 0,
    };
  }

  async transaction<T>(callback: (trxDriver: DatabaseDriver) => Promise<T>): Promise<T> {
    this.ensureConnected();

    if (this.isTransaction) {
      // Nested transaction -> Use Savepoints
      const savepointName = `sp_${this.savepointDepth + 1}`;
      await this.client!.query(`SAVEPOINT ${savepointName}`);

      try {
        const trxDriver = new PostgresDriver(this.config, this.client!, this.savepointDepth + 1);
        const result = await callback(trxDriver);
        await this.client!.query(`RELEASE SAVEPOINT ${savepointName}`);
        return result;
      } catch (error) {
        await this.client!.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
        throw error;
      }
    }

    const client = await (this.pool as pkg.Pool).connect();

    try {
      await client.query('BEGIN');

      // Create a scoped driver using the specific checked out client
      const trxDriver = new PostgresDriver(this.config, client);
      const result = await callback(trxDriver);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getPool(): pkg.Pool | null {
    return this.pool;
  }

  private ensureConnected() {
    if (!this.pool && !this.client) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }
}
