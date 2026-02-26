/**
 * @gao/orm — MySQL Driver
 *
 * MySQL driver implementation using `mysql2`. Supports prepared statements,
 * connection pooling, and nested transactions via savepoints.
 */

import mysql from 'mysql2/promise';
import type { ExecuteResult } from '../types.js';
import type { DatabaseDriver } from './driver.interface.js';

export interface MySQLDriverOptions extends mysql.PoolOptions {
  /** Connection URI, e.g., mysql://user:password@localhost:3306/mydb */
  uri?: string;
}

export class MySQLDriver implements DatabaseDriver {
  private pool: mysql.Pool | null = null;
  private connection: mysql.PoolConnection | null = null;
  private isTransaction = false;
  private savepointDepth = 0;

  constructor(
    private config: MySQLDriverOptions,
    connection?: mysql.PoolConnection,
    savepointDepth = 0,
  ) {
    if (connection) {
      this.connection = connection;
      this.isTransaction = true;
      this.savepointDepth = savepointDepth;
    }
  }

  async connect(): Promise<void> {
    if (this.pool || this.connection) return;

    if (this.config.uri) {
      this.pool = mysql.createPool(this.config.uri);
    } else {
      this.pool = mysql.createPool(this.config);
    }

    // Test connection
    const conn = await this.pool.getConnection();
    conn.release();
  }

  async disconnect(): Promise<void> {
    if (this.isTransaction) return;
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.ensureConnected();

    let rows: any;

    if (this.isTransaction && this.connection) {
      [rows] = await this.connection.execute(sql, params as any[]);
    } else {
      [rows] = await this.pool!.execute(sql, params as any[]);
    }

    return rows as T[];
  }

  async execute(sql: string, params: unknown[] = []): Promise<ExecuteResult> {
    this.ensureConnected();

    let result: any;

    if (this.isTransaction && this.connection) {
      [result] = await this.connection.execute(sql, params as any[]);
    } else {
      [result] = await this.pool!.execute(sql, params as any[]);
    }

    const header = result as mysql.ResultSetHeader;

    return {
      insertId: header.insertId,
      rowsAffected: header.affectedRows,
    };
  }

  async transaction<T>(callback: (trxDriver: DatabaseDriver) => Promise<T>): Promise<T> {
    this.ensureConnected();

    if (this.isTransaction && this.connection) {
      const savepointName = `sp_${this.savepointDepth + 1}`;
      await this.connection.query(`SAVEPOINT ${savepointName}`);

      try {
        const trxDriver = new MySQLDriver(this.config, this.connection, this.savepointDepth + 1);
        const result = await callback(trxDriver);
        await this.connection.query(`RELEASE SAVEPOINT ${savepointName}`);
        return result;
      } catch (error) {
        await this.connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
        throw error;
      }
    }

    const connection = await this.pool!.getConnection();

    try {
      await connection.beginTransaction();

      const trxDriver = new MySQLDriver(this.config, connection);
      const result = await callback(trxDriver);

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  getPool(): mysql.Pool | null {
    return this.pool;
  }

  private ensureConnected() {
    if (!this.pool && !this.connection) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }
}
