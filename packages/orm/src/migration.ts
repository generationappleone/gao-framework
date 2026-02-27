/**
 * @gao/orm — Migration Engine
 *
 * Handles database schema migrations: version tracking, up/down execution,
 * batch support, and automatic rollback on failure via transactions.
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

export interface MigrationStatus {
  name: string;
  status: 'executed' | 'pending';
  executedAt?: string;
  batch?: number;
}

export class MigrationEngine {
  private migrationTableName = 'gao_migrations';

  constructor(private driver: DatabaseDriver) { }

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
    await this.driver.execute(`
      CREATE TABLE IF NOT EXISTS "${this.migrationTableName}" (
        id INTEGER PRIMARY KEY ${this.isPostgres() ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
        name VARCHAR(255) NOT NULL UNIQUE,
        batch INTEGER NOT NULL DEFAULT 1,
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
   * Get the current batch number.
   */
  async getCurrentBatch(): Promise<number> {
    await this.setup();
    const rows = await this.driver.query<{ max_batch: number | null }>(
      `SELECT MAX(batch) as max_batch FROM "${this.migrationTableName}"`,
    );
    return rows[0]?.max_batch ?? 0;
  }

  /**
   * Apply all pending migrations in a transaction.
   * @param migrations Array of available migrations
   * @returns Array of migration names that were executed
   */
  async up(migrations: Migration[]): Promise<string[]> {
    const executed = await this.getExecutedMigrations();
    const pending = migrations.filter((m) => !executed.includes(m.name));

    if (pending.length === 0) return [];

    const batch = (await this.getCurrentBatch()) + 1;
    const newlyExecuted: string[] = [];

    for (const migration of pending) {
      await this.driver.transaction(async (trx) => {
        await migration.up(trx);
        await trx.execute(
          `INSERT INTO "${this.migrationTableName}" (name, batch) VALUES (${this.isPostgres() ? '$1, $2' : '?, ?'})`,
          [migration.name, batch],
        );
      });
      newlyExecuted.push(migration.name);
    }

    return newlyExecuted;
  }

  /**
   * Rollback N steps (migrations in reverse order).
   * @param migrations All available migrations in the codebase
   * @param steps Number of migrations to rollback (default: 1)
   * @returns Array of rolled-back migration names
   */
  async down(migrations: Migration[], steps = 1): Promise<string[]> {
    await this.setup();
    const rows = await this.driver.query<{ id: number; name: string }>(
      `SELECT id, name FROM "${this.migrationTableName}" ORDER BY id DESC LIMIT ${steps}`,
    );

    if (rows.length === 0) return [];

    const rolledBack: string[] = [];

    for (const row of rows) {
      const migrationObj = migrations.find((m) => m.name === row.name);

      if (!migrationObj) {
        throw new Error(`Cannot rollback: Migration '${row.name}' not found in codebase.`);
      }

      await this.driver.transaction(async (trx) => {
        await migrationObj.down(trx);
        await trx.execute(
          `DELETE FROM "${this.migrationTableName}" WHERE name = ${this.isPostgres() ? '$1' : '?'}`,
          [row.name],
        );
      });

      rolledBack.push(row.name);
    }

    return rolledBack;
  }

  /**
   * Rollback all executed migrations (reset to empty database).
   * @param migrations All available migrations in the codebase
   * @returns Array of rolled-back migration names
   */
  async reset(migrations: Migration[]): Promise<string[]> {
    const executed = await this.getExecutedMigrations();
    return this.down(migrations, executed.length);
  }

  /**
   * Reset and re-apply all migrations.
   * @param migrations All available migrations in the codebase
   * @returns { rolledBack, applied }
   */
  async refresh(
    migrations: Migration[],
  ): Promise<{ rolledBack: string[]; applied: string[] }> {
    const rolledBack = await this.reset(migrations);
    const applied = await this.up(migrations);
    return { rolledBack, applied };
  }

  /**
   * Get status of all migrations.
   * @param migrations All available migrations in the codebase
   */
  async status(migrations: Migration[]): Promise<MigrationStatus[]> {
    await this.setup();
    const rows = await this.driver.query<{ name: string; batch: number; executed_at: string }>(
      `SELECT name, batch, executed_at FROM "${this.migrationTableName}" ORDER BY id ASC`,
    );

    const executedMap = new Map(rows.map((r) => [r.name, r]));
    const result: MigrationStatus[] = [];

    for (const migration of migrations) {
      const executed = executedMap.get(migration.name);
      if (executed) {
        result.push({
          name: migration.name,
          status: 'executed',
          executedAt: executed.executed_at,
          batch: executed.batch,
        });
      } else {
        result.push({
          name: migration.name,
          status: 'pending',
        });
      }
    }

    return result;
  }

  private isPostgres(): boolean {
    return !!this.driver.getPool?.();
  }
}
