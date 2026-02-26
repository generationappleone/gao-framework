import type pg from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresDriver } from '../src/drivers/postgres.js';

vi.mock('pg', () => {
  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    release: vi.fn(),
  };
  const mockPool = {
    connect: vi.fn().mockResolvedValue(mockClient),
    query: vi.fn(),
    end: vi.fn(),
  };
  return {
    default: { Pool: vi.fn(() => mockPool) },
    Pool: vi.fn(() => mockPool),
  };
});

describe('Transaction savepoints', () => {
  let driver: PostgresDriver;
  let pool: pg.Pool;

  beforeEach(async () => {
    vi.clearAllMocks();
    driver = new PostgresDriver({ connectionString: 'postgres://localhost/test' });
    await driver.connect();
    pool = driver.getPool() as pg.Pool;
  });

  it('should use savepoints for nested transactions in postgres', async () => {
    const mockClient = await pool.connect();

    await driver.transaction(async (trx1) => {
      await trx1.query('SELECT 1');

      await trx1.transaction(async (trx2) => {
        await trx2.query('SELECT 2');

        await trx2.transaction(async (trx3) => {
          await trx3.query('SELECT 3');
        });
      });
    });

    // The sequence should be:
    // BEGIN
    // SELECT 1
    // SAVEPOINT sp_1
    // SELECT 2
    // SAVEPOINT sp_2
    // SELECT 3
    // RELEASE SAVEPOINT sp_2
    // RELEASE SAVEPOINT sp_1
    // COMMIT

    const calls = (mockClient.query as unknown as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0],
    );

    expect(calls).toEqual([
      'BEGIN',
      'SELECT 1',
      'SAVEPOINT sp_1',
      'SELECT 2',
      'SAVEPOINT sp_2',
      'SELECT 3',
      'RELEASE SAVEPOINT sp_2',
      'RELEASE SAVEPOINT sp_1',
      'COMMIT',
    ]);
  });

  it('should rollback to savepoint when nested transaction fails', async () => {
    const mockClient = await pool.connect();
    const mockQuery = mockClient.query as unknown as ReturnType<typeof vi.fn>;

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql === 'SELECT 2') throw new Error('Query error');
      return { rows: [] };
    });

    await expect(
      driver.transaction(async (trx1) => {
        await trx1.query('SELECT 1');

        await trx1.transaction(async (trx2) => {
          await trx2.query('SELECT 2'); // throws error
        });
      }),
    ).rejects.toThrow('Query error');

    const calls = mockQuery.mock.calls.map((c) => c[0]);

    expect(calls).toEqual([
      'BEGIN',
      'SELECT 1',
      'SAVEPOINT sp_1',
      'SELECT 2', // Throws
      'ROLLBACK TO SAVEPOINT sp_1', // Recovers sub-trx
      'ROLLBACK', // Outer trx fails due to bubble up
    ]);
  });
});
