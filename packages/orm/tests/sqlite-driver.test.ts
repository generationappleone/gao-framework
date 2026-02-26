import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLiteDriver } from '../src/drivers/sqlite.js';

describe('SQLite Driver', () => {
  let driver: SQLiteDriver;

  beforeEach(async () => {
    driver = new SQLiteDriver({ filename: ':memory:' });
    await driver.connect();
    await driver.execute(
      'CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)',
    );
  });

  afterEach(async () => {
    await driver.disconnect();
  });

  it('should connect and execute table queries', async () => {
    const result = await driver.execute('INSERT INTO users (name) VALUES (?)', ['John Doe']);

    expect(result.rowsAffected).toBe(1);
    expect(Number(result.insertId)).toBe(1);
  });

  it('should query data', async () => {
    await driver.execute('INSERT INTO users (name) VALUES (?)', ['Alice']);
    await driver.execute('INSERT INTO users (name) VALUES (?)', ['Bob']);

    const rows = await driver.query<{ id: number; name: string }>(
      'SELECT * FROM users ORDER BY name ASC',
    );

    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('Alice');
    expect(rows[1].name).toBe('Bob');
  });

  it('should commit transaction on success', async () => {
    await driver.transaction(async (trx) => {
      await trx.execute('INSERT INTO users (name) VALUES (?)', ['Charlie']);
    });

    const rows = await driver.query('SELECT * FROM users');
    expect(rows).toHaveLength(1);
  });

  it('should rollback transaction on error', async () => {
    await expect(
      driver.transaction(async (trx) => {
        await trx.execute('INSERT INTO users (name) VALUES (?)', ['Bad Idea']);
        throw new Error('Abort transaction');
      }),
    ).rejects.toThrow('Abort transaction');

    const rows = await driver.query('SELECT * FROM users');
    expect(rows).toHaveLength(0); // Should be empty because it rolled back
  });
});
