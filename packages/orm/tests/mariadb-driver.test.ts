import * as mariadb from 'mariadb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MariaDBDriver } from '../src/drivers/mariadb.js';

vi.mock('mariadb', () => {
  const mockConnection = {
    query: vi.fn(),
    release: vi.fn(),
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
  };
  const mockPool = {
    getConnection: vi.fn().mockResolvedValue(mockConnection),
    query: vi.fn(),
    end: vi.fn(),
  };
  return {
    createPool: vi.fn(() => mockPool),
  };
});

describe('MariaDB Driver', () => {
  let driver: MariaDBDriver;

  beforeEach(async () => {
    vi.clearAllMocks();
    driver = new MariaDBDriver({ host: 'localhost', database: 'test' });
    await driver.connect();
  });

  it('should map return rows from query', async () => {
    const pool = driver.getPool();
    const queryMock = pool?.query as unknown as ReturnType<typeof vi.fn>;
    queryMock.mockResolvedValueOnce([{ id: 1 }]);

    const rows = await driver.query('SELECT * FROM test');
    expect(rows).toEqual([{ id: 1 }]);
  });

  it('should map insert metadata from execute', async () => {
    const pool = driver.getPool();
    const queryMock = pool?.query as unknown as ReturnType<typeof vi.fn>;
    queryMock.mockResolvedValueOnce({ affectedRows: 2, insertId: 50n });

    const result = await driver.execute('INSERT INTO test (name) VALUES (?)', ['John']);

    expect(result.rowsAffected).toBe(2);
    expect(result.insertId).toBe(50);
  });

  it('should manage transactions with savepoints', async () => {
    const pool = driver.getPool();
    const mockConn = await pool!.getConnection();
    const queryMock = mockConn.query as unknown as ReturnType<typeof vi.fn>;

    queryMock.mockResolvedValueOnce([]);

    await driver.transaction(async (trx1) => {
      await trx1.transaction(async (trx2) => {
        await trx2.query('SELECT 1');
      });
    });

    expect(mockConn.beginTransaction).toHaveBeenCalled();
    expect(mockConn.query).toHaveBeenCalledWith('SAVEPOINT sp_1');
    expect(mockConn.query).toHaveBeenCalledWith('SELECT 1', []);
    expect(mockConn.query).toHaveBeenCalledWith('RELEASE SAVEPOINT sp_1');
    expect(mockConn.commit).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });
});
