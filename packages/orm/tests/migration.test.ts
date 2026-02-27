import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';
import { type Migration, MigrationEngine } from '../src/migration.js';

describe('Migration Engine', () => {
  let mockDriver: DatabaseDriver;
  let engine: MigrationEngine;

  beforeEach(() => {
    const currentMigrationData: { name: string; batch?: number }[] = [];

    mockDriver = {
      execute: vi.fn(),
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT name FROM')) {
          return currentMigrationData;
        }
        if (sql.includes('MAX(batch)')) {
          return [{ max_batch: currentMigrationData.length > 0 ? 1 : 0 }];
        }
        if (sql.includes('ORDER BY id DESC LIMIT')) {
          return currentMigrationData.length > 0
            ? [
              {
                id: currentMigrationData.length,
                name: currentMigrationData[currentMigrationData.length - 1]!.name,
              },
            ]
            : [];
        }
        if (sql.includes('SELECT name, batch, executed_at')) {
          return currentMigrationData.map((m, i) => ({
            name: m.name,
            batch: m.batch ?? 1,
            executed_at: '2026-01-01',
          }));
        }
        return [];
      }),
      connect: vi.fn(),
      disconnect: vi.fn(),
      transaction: vi.fn().mockImplementation(async (cb) => cb(mockDriver)),
    } as unknown as DatabaseDriver;

    engine = new MigrationEngine(mockDriver);
  });

  it('should run pending migrations', async () => {
    const m1: Migration = {
      name: '2023_01_01_users',
      up: vi.fn(),
      down: vi.fn(),
    };
    const m2: Migration = {
      name: '2023_01_02_posts',
      up: vi.fn(),
      down: vi.fn(),
    };

    const executed = await engine.up([m1, m2]);

    expect(executed).toEqual(['2023_01_01_users', '2023_01_02_posts']);
    expect(m1.up).toHaveBeenCalled();
    expect(m2.up).toHaveBeenCalled();
    expect(mockDriver.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "gao_migrations"'),
      ['2023_01_01_users', expect.any(Number)],
    );
  });

  it('should not run already executed migrations', async () => {
    // Simulate '2023_01_01_users' being already executed
    mockDriver.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT name FROM')) return [{ name: '2023_01_01_users' }];
      if (sql.includes('MAX(batch)')) return [{ max_batch: 1 }];
      return [];
    });

    const m1: Migration = {
      name: '2023_01_01_users',
      up: vi.fn(),
      down: vi.fn(),
    };
    const m2: Migration = {
      name: '2023_01_02_posts',
      up: vi.fn(),
      down: vi.fn(),
    };

    const executed = await engine.up([m1, m2]);

    expect(executed).toEqual(['2023_01_02_posts']); // only m2 ran
    expect(m1.up).not.toHaveBeenCalled();
    expect(m2.up).toHaveBeenCalled();
  });

  it('should rollback the last migration', async () => {
    mockDriver.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('ORDER BY id DESC')) return [{ id: 1, name: '2023_01_01_users' }];
      return [];
    });

    const m1: Migration = {
      name: '2023_01_01_users',
      up: vi.fn(),
      down: vi.fn(),
    };

    const rolledBack = await engine.down([m1]);

    expect(rolledBack).toEqual(['2023_01_01_users']);
    expect(m1.down).toHaveBeenCalled();
    expect(mockDriver.execute).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM "gao_migrations"'),
      ['2023_01_01_users'],
    );
  });

  it('should return empty array when no migrations to rollback', async () => {
    mockDriver.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('ORDER BY id DESC')) return [];
      return [];
    });

    const m1: Migration = { name: 'm1', up: vi.fn(), down: vi.fn() };

    const rolledBack = await engine.down([m1]);

    expect(rolledBack).toEqual([]);
    expect(m1.down).not.toHaveBeenCalled();
  });

  it('should throw error if migration code is missing during rollback', async () => {
    mockDriver.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('ORDER BY id DESC')) return [{ id: 1, name: 'missing_migration' }];
      return [];
    });

    const m1: Migration = { name: 'other_migration', up: vi.fn(), down: vi.fn() };

    await expect(engine.down([m1])).rejects.toThrow(/not found in codebase/);
  });

  // ─── New tests for enhanced features ─────────────────────────

  it('should rollback multiple steps', async () => {
    mockDriver.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('ORDER BY id DESC LIMIT 2')) {
        return [
          { id: 2, name: '2023_01_02_posts' },
          { id: 1, name: '2023_01_01_users' },
        ];
      }
      return [];
    });

    const m1: Migration = { name: '2023_01_01_users', up: vi.fn(), down: vi.fn() };
    const m2: Migration = { name: '2023_01_02_posts', up: vi.fn(), down: vi.fn() };

    const rolledBack = await engine.down([m1, m2], 2);

    expect(rolledBack).toEqual(['2023_01_02_posts', '2023_01_01_users']);
    expect(m2.down).toHaveBeenCalled();
    expect(m1.down).toHaveBeenCalled();
  });

  it('should get migration status', async () => {
    mockDriver.query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT name, batch, executed_at')) {
        return [{ name: '2023_01_01_users', batch: 1, executed_at: '2026-01-01' }];
      }
      return [];
    });

    const m1: Migration = { name: '2023_01_01_users', up: vi.fn(), down: vi.fn() };
    const m2: Migration = { name: '2023_01_02_posts', up: vi.fn(), down: vi.fn() };

    const statuses = await engine.status([m1, m2]);

    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toEqual({
      name: '2023_01_01_users',
      status: 'executed',
      executedAt: '2026-01-01',
      batch: 1,
    });
    expect(statuses[1]).toEqual({
      name: '2023_01_02_posts',
      status: 'pending',
    });
  });
});
