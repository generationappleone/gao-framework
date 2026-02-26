import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';
import { type Migration, MigrationEngine } from '../src/migration.js';

describe('Migration Engine', () => {
  let mockDriver: DatabaseDriver;
  let engine: MigrationEngine;

  beforeEach(() => {
    const currentMigrationData: { name: string }[] = [];

    mockDriver = {
      execute: vi.fn(),
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT name')) {
          return currentMigrationData;
        }
        if (sql.includes('ORDER BY id DESC LIMIT 1')) {
          return currentMigrationData.length > 0
            ? [
                {
                  id: currentMigrationData.length,
                  name: currentMigrationData[currentMigrationData.length - 1]!.name,
                },
              ]
            : [];
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
      ['2023_01_01_users'],
    );
  });

  it('should not run already executed migrations', async () => {
    // Simulate '2023_01_01_users' being already executed
    mockDriver.query = vi.fn().mockResolvedValueOnce([{ name: '2023_01_01_users' }]);

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
    mockDriver.query = vi.fn().mockResolvedValueOnce([{ id: 1, name: '2023_01_01_users' }]); // the SELECT limit 1 mock

    const m1: Migration = {
      name: '2023_01_01_users',
      up: vi.fn(),
      down: vi.fn(),
    };

    const rolledBack = await engine.down([m1]);

    expect(rolledBack).toBe('2023_01_01_users');
    expect(m1.down).toHaveBeenCalled();
    expect(mockDriver.execute).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM "gao_migrations"'),
      ['2023_01_01_users'],
    );
  });

  it('should return null when no migrations to rollback', async () => {
    mockDriver.query = vi.fn().mockResolvedValueOnce([]); // empty table

    const m1: Migration = { name: 'm1', up: vi.fn(), down: vi.fn() };

    const rolledBack = await engine.down([m1]);

    expect(rolledBack).toBeNull();
    expect(m1.down).not.toHaveBeenCalled();
  });

  it('should throw error if migration code is missing during rollback', async () => {
    mockDriver.query = vi.fn().mockResolvedValueOnce([{ id: 1, name: 'missing_migration' }]);

    const m1: Migration = { name: 'other_migration', up: vi.fn(), down: vi.fn() };

    await expect(engine.down([m1])).rejects.toThrow(/not found in codebase/);
  });
});
