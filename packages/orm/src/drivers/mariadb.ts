/**
 * @gao/orm — MariaDB Driver
 *
 * MariaDB driver implementation using `mariadb`.
 */

import * as mariadb from 'mariadb';
import type { ExecuteResult } from '../types.js';
import type { DatabaseDriver } from './driver.interface.js';

export interface MariaDBDriverOptions extends mariadb.PoolConfig {
  /** Additional custom options */
}

export class MariaDBDriver implements DatabaseDriver {
  private pool: mariadb.Pool | null = null;
  private connection: mariadb.Connection | null = null;
  private isTransaction = false;
  private savepointDepth = 0;

  constructor(
    private config: MariaDBDriverOptions,
    connection?: mariadb.Connection,
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

    this.pool = mariadb.createPool(this.config);

    // Test connection
    const conn = await this.pool.getConnection();
    await conn.release();
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
      rows = await this.connection.query(sql, params as any[]);
    } else {
      rows = await this.pool!.query(sql, params as any[]);
    }

    // mariadb returns the array directly, unlike mysql2 which returns [rows, fields]
    return rows as T[];
  }

  async execute(sql: string, params: unknown[] = []): Promise<ExecuteResult> {
    this.ensureConnected();

    let result: any;

    if (this.isTransaction && this.connection) {
      result = await this.connection.query(sql, params as any[]);
    } else {
      result = await this.pool!.query(sql, params as any[]);
    }

    return {
      insertId: result.insertId !== undefined ? Number(result.insertId) : undefined,
      rowsAffected: result.affectedRows ?? 0,
    };
  }

  async transaction<T>(callback: (trxDriver: DatabaseDriver) => Promise<T>): Promise<T> {
    this.ensureConnected();

    if (this.isTransaction && this.connection) {
      const savepointName = `sp_${this.savepointDepth + 1}`;
      await this.connection.query(`SAVEPOINT ${savepointName}`);

      try {
        const trxDriver = new MariaDBDriver(this.config, this.connection, this.savepointDepth + 1);
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

      const trxDriver = new MariaDBDriver(this.config, connection);
      const result = await callback(trxDriver);

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.release();
    }
  }

  getPool(): mariadb.Pool | null {
    return this.pool;
  }

  private ensureConnected() {
    if (!this.pool && !this.connection) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }
}
