import mysql from 'mysql2/promise';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MySQLDriver } from '../src/drivers/mysql.js';

vi.mock('mysql2/promise', () => {
  const mockConnection = {
    execute: vi.fn().mockResolvedValue([[], undefined]),
    query: vi.fn().mockResolvedValue([[], undefined]),
    release: vi.fn(),
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
  };
  const mockPool = {
    getConnection: vi.fn().mockResolvedValue(mockConnection),
    execute: vi.fn(),
    end: vi.fn(),
  };
  return {
    default: {
      createPool: vi.fn(() => mockPool),
    },
  };
});

describe('MySQL Driver', () => {
  let driver: MySQLDriver;

  beforeEach(async () => {
    vi.clearAllMocks();
    driver = new MySQLDriver({ uri: 'mysql://localhost/test' });
    await driver.connect();
  });

  it('should execute parameterized queries via execute', async () => {
    const pool = driver.getPool();
    const executeMock = pool?.execute as unknown as ReturnType<typeof vi.fn>;

    executeMock.mockResolvedValueOnce([{ affectedRows: 1, insertId: 99 }, undefined]);

    const result = await driver.execute('INSERT INTO test (name) VALUES (?)', ['John']);

    expect(result.rowsAffected).toBe(1);
    expect(result.insertId).toBe(99);
    expect(pool?.execute).toHaveBeenCalledWith('INSERT INTO test (name) VALUES (?)', ['John']);
  });

  it('should map return rows via query', async () => {
    const pool = driver.getPool();
    const executeMock = pool?.execute as unknown as ReturnType<typeof vi.fn>;

    executeMock.mockResolvedValueOnce([[{ id: 1 }], undefined]);

    const rows = await driver.query('SELECT * FROM test');
    expect(rows).toEqual([{ id: 1 }]);
  });

  it('should manage transactions using pool connections', async () => {
    const pool = driver.getPool();
    const mockConn = await pool!.getConnection();

    const executeMock = mockConn.execute as unknown as ReturnType<typeof vi.fn>;
    executeMock.mockResolvedValueOnce([[], undefined]);

    const result = await driver.transaction(async (trx) => {
      await trx.query('SELECT 1');
      return 'done';
    });

    expect(result).toBe('done');
    expect(mockConn.beginTransaction).toHaveBeenCalled();
    expect(mockConn.execute).toHaveBeenCalledWith('SELECT 1', []);
    expect(mockConn.commit).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });

  it('should use savepoints for nested transactions in mysql', async () => {
    const pool = driver.getPool();
    const mockConn = await pool!.getConnection();

    await driver.transaction(async (trx1) => {
      await trx1.transaction(async (trx2) => {
        await trx2.query('SELECT 2');
      });
    });

    expect(mockConn.beginTransaction).toHaveBeenCalled();
    expect(mockConn.query).toHaveBeenCalledWith('SAVEPOINT sp_1');
    expect(mockConn.query).toHaveBeenCalledWith('RELEASE SAVEPOINT sp_1');
    expect(mockConn.commit).toHaveBeenCalled();
  });
});
