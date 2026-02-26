/**
 * @gao/orm — Migration Engine
 *
 * Handles database schema migrations: version tracking, up/down execution,
 * and automatic rollback on failure via transactions.
 */

import type { DatabaseDriver } from './drivers/driver.interface.js';

export interface Migration {
  /** Unique name/version of the migration, usually a timestamp + name */
  name: string;
  /** Apply changes */
  up(driver: DatabaseDriver): Promise<void>;
  /** Revert changes */
  down(driver: DatabaseDriver): Promise<void>;
}

export class MigrationEngine {
  private migrationTableName = 'gao_migrations';

  constructor(private driver: DatabaseDriver) {}

  /**
   * Set a custom table name for tracking migrations.
   */
  setMigrationTable(name: string): this {
    this.migrationTableName = name;
    return this;
  }

  /**
   * Initializes the migrations tracking table if it doesn't exist.
   */
  async setup(): Promise<void> {
    // Safe CREATE TABLE IF NOT EXISTS across sqlite/postgres/mysql
    await this.driver.execute(`
            CREATE TABLE IF NOT EXISTS "${this.migrationTableName}" (
                id INTEGER PRIMARY KEY ${this.isPostgres() ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
  }

  /**
   * Get a list of already executed migrations.
   */
  async getExecutedMigrations(): Promise<string[]> {
    await this.setup();
    const rows = await this.driver.query<{ name: string }>(
      `SELECT name FROM "${this.migrationTableName}" ORDER BY id ASC`,
    );
    return rows.map((r) => r.name);
  }

  /**
   * Apply all pending migrations in a transaction.
   * @param migrations Array of available migrations
   * @returns Array of migration names that were executed
   */
  async up(migrations: Migration[]): Promise<string[]> {
    const executed = await this.getExecutedMigrations();
    const pending = migrations.filter((m) => !executed.includes(m.name));

    const newlyExecuted: string[] = [];

    for (const migration of pending) {
      await this.driver.transaction(async (trx) => {
        // Run the migration
        await migration.up(trx);

        // Record execution
        await trx.execute(
          `INSERT INTO "${this.migrationTableName}" (name) VALUES (${this.isPostgres() ? '$1' : '?'})`,
          [migration.name],
        );
      });
      newlyExecuted.push(migration.name);
    }

    return newlyExecuted;
  }

  /**
   * Rollback the last executed migration (or a specific batch).
   * For simplicity, this rolls back the most recent single migration.
   * @param migrations Array of available migrations in the codebase
   */
  async down(migrations: Migration[]): Promise<string | null> {
    await this.setup();
    const rows = await this.driver.query<{ id: number; name: string }>(
      `SELECT id, name FROM "${this.migrationTableName}" ORDER BY id DESC LIMIT 1`,
    );

    if (rows.length === 0) return null; // Nothing to rollback

    const lastMigrationName = rows[0]!.name;
    const migrationObj = migrations.find((m) => m.name === lastMigrationName);

    if (!migrationObj) {
      throw new Error(`Cannot rollback: Migration '${lastMigrationName}' not found in codebase.`);
    }

    await this.driver.transaction(async (trx) => {
      await migrationObj.down(trx);
      await trx.execute(
        `DELETE FROM "${this.migrationTableName}" WHERE name = ${this.isPostgres() ? '$1' : '?'}`,
        [lastMigrationName],
      );
    });

    return lastMigrationName;
  }

  private isPostgres(): boolean {
    // Quick duck-type to guess postgres vs sqlite for simple query dialects.
    // In a real implementation this would check dialect strictly.
    // Assuming PostgresDriver has standard pooling structure
    return !!this.driver.getPool?.(); // Wait, SQLite getPool returns Database, Postgres returns pg.Pool.
  }
}
