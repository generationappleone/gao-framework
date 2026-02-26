/**
 * @gao/orm — Connection Manager
 *
 * Manages database driver selection, initialization, health checks,
 * and graceful shutdown operations.
 */

import type { DatabaseDriver } from './drivers/driver.interface.js';

export interface ConnectionConfig {
  driver: 'sqlite' | 'postgres' | 'mysql' | 'mariadb';
  /** The specific options required by the chosen driver */
  options: Record<string, unknown>;
  /** Ping the database on startup array of times */
  healthRetryCount?: number;
  /** Wait duration between pings */
  healthRetryDelayMs?: number;
}

export class ConnectionManager {
  private driver: DatabaseDriver | null = null;
  private isConnected = false;

  constructor(private config: ConnectionConfig) {}

  /**
   * Set the compiled driver manually. Helpful for dependency injection.
   */
  setDriver(driver: DatabaseDriver) {
    this.driver = driver;
  }

  /**
   * Connects to the database using the configured driver.
   * Implements a retry-loop for health checking the connection.
   */
  async connect(): Promise<void> {
    if (!this.driver) {
      throw new Error(`Database driver not defined. Configured for type: ${this.config.driver}`);
    }

    if (this.isConnected) return;

    const retries = this.config.healthRetryCount ?? 3;
    const delay = this.config.healthRetryDelayMs ?? 1000;

    let attempt = 1;
    while (attempt <= retries) {
      try {
        await this.driver.connect();
        // Perform a simple health check query (valid for both PG and SQLite)
        await this.driver.query('SELECT 1 as healthy');

        this.isConnected = true;
        return;
      } catch (error) {
        if (attempt === retries) {
          throw new Error(
            `Database connection failed after ${retries} attempts: ${(error as Error).message}`,
          );
        }

        await new Promise((res) => setTimeout(res, delay));
        attempt++;
      }
    }
  }

  /**
   * Returns the active database driver instance.
   */
  getDriver(): DatabaseDriver {
    if (!this.driver || !this.isConnected) {
      throw new Error('Database is not connected. Call connect() first.');
    }
    return this.driver;
  }

  /**
   * Gracefully disconnects all connections.
   */
  async disconnect(): Promise<void> {
    if (!this.driver || !this.isConnected) return;

    await this.driver.disconnect();
    this.isConnected = false;
  }
}
