import pg from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresDriver } from '../src/drivers/postgres.js';

// Mock `pg` dependency for tests
vi.mock('pg', () => {
  const mockClient = {
    query: vi.fn(),
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

describe('Postgres Driver', () => {
  let driver: PostgresDriver;

  beforeEach(async () => {
    vi.clearAllMocks();
    driver = new PostgresDriver({ connectionString: 'postgres://localhost/test' });
    await driver.connect();
  });

  it('should connect using a pool', async () => {
    expect(pg.Pool).toHaveBeenCalled();
    const pool = driver.getPool();
    expect(pool).toBeDefined();
    expect(pool?.connect).toHaveBeenCalled(); // verified connection
  });

  it('should execute parameterized queries', async () => {
    const pool = driver.getPool();
    const mockPoolQuery = pool?.query as unknown as ReturnType<typeof vi.fn>;
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'John Doe' }],
      rowCount: 1,
    });

    const rows = await driver.query('SELECT * FROM users WHERE name = $1', ['John Doe']);
    expect(rows).toEqual([{ id: 1, name: 'John Doe' }]);
    expect(pool?.query).toHaveBeenCalledWith('SELECT * FROM users WHERE name = $1', ['John Doe']);
  });

  it('should return rowsAffected and insertId from execute', async () => {
    const pool = driver.getPool();
    const mockPoolQuery = pool?.query as unknown as ReturnType<typeof vi.fn>;
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ id: 42 }],
      rowCount: 1,
    });

    const result = await driver.execute('INSERT INTO users(name) VALUES($1) RETURNING id', [
      'Jane',
    ]);
    expect(result.rowsAffected).toBe(1);
    expect(result.insertId).toBe(42);
  });

  it('should manage transactions with a dedicated client', async () => {
    const pool = driver.getPool();
    const mockClient = await (pool as pg.Pool).connect();

    const result = await driver.transaction(async (trx) => {
      const mockClientQuery = mockClient.query as unknown as ReturnType<typeof vi.fn>;
      mockClientQuery.mockResolvedValueOnce({ rows: [] });
      await trx.query('SELECT 1');
      return 'success';
    });

    expect(result).toBe('success');
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('SELECT 1', []);
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should rollback transaction on error', async () => {
    const pool = driver.getPool();
    const mockClient = await (pool as pg.Pool).connect();

    await expect(
      driver.transaction(async (trx) => {
        const mockClientQuery = mockClient.query as unknown as ReturnType<typeof vi.fn>;
        mockClientQuery.mockRejectedValueOnce(new Error('Syntax Error'));
        await trx.query('BAD SQL');
      }),
    ).rejects.toThrow('Syntax Error');

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
