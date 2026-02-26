import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';
import { QueryBuilder } from '../src/query-builder.js';

describe('Query Builder', () => {
  let mockDriver: DatabaseDriver;

  beforeEach(() => {
    mockDriver = {
      query: vi.fn(),
      execute: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      transaction: vi.fn(),
    } as unknown as DatabaseDriver;
  });

  it('should build a simple select query in postgres dialect', () => {
    const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
    const { sql, params } = qb.where('id', 1).toSql();

    expect(sql).toBe('SELECT * FROM "users" WHERE "id" = $1');
    expect(params).toEqual([1]);
  });

  it('should build a simple select query in sqlite dialect', () => {
    const qb = new QueryBuilder(mockDriver, 'sqlite', 'users');
    const { sql, params } = qb.where('status', '>', 5).toSql();

    expect(sql).toBe('SELECT * FROM "users" WHERE "status" > ?');
    expect(params).toEqual([5]);
  });

  it('should build complex select queries with joins and ordering', () => {
    const qb = new QueryBuilder(mockDriver, 'sqlite', 'users');

    qb.select('users.id', 'posts.title')
      .join('posts', 'posts.user_id', '=', 'users.id')
      .where('users.active', true)
      .orWhere('users.role', 'admin')
      .orderBy('users.created_at', 'DESC')
      .limit(10)
      .offset(20);

    const { sql, params } = qb.toSql();

    expect(sql).toContain('SELECT users.id, posts.title FROM "users"');
    expect(sql).toContain('INNER JOIN "posts" ON "posts"."user_id" = "users"."id"');
    expect(sql).toContain('WHERE "users"."active" = ? OR "users"."role" = ?');
    expect(sql).toContain('ORDER BY "users"."created_at" DESC');
    expect(sql).toContain('LIMIT 10 OFFSET 20');
    expect(params).toEqual([true, 'admin']);
  });

  it('should compile an insert statement', () => {
    const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
    const { sql, params } = qb.compileInsert({ name: 'Alice', age: 30 });

    expect(sql).toBe('INSERT INTO "users" ("name", "age") VALUES ($1, $2)');
    expect(params).toEqual(['Alice', 30]);
  });

  it('should append RETURNING id on postgres inserts', async () => {
    const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
    await qb.insert({ name: 'Bob' });

    expect(mockDriver.execute).toHaveBeenCalledWith(
      'INSERT INTO "users" ("name") VALUES ($1) RETURNING id',
      ['Bob'],
    );
  });

  it('should compile an update statement', () => {
    const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
    const { sql, params } = qb.where('id', 5).compileUpdate({ status: 'active' });

    expect(sql).toBe('UPDATE "users" SET "status" = $1 WHERE "id" = $2');
    expect(params).toEqual(['active', 5]);
  });

  it('should compile a delete statement', () => {
    const qb = new QueryBuilder(mockDriver, 'postgres', 'users');
    const { sql, params } = qb.where('id', 5).compileDelete();

    expect(sql).toBe('DELETE FROM "users" WHERE "id" = $1');
    expect(params).toEqual([5]);
  });

  it('should call driver.query via get() and first()', async () => {
    const qb = new QueryBuilder(mockDriver, 'sqlite', 'users');
    const mockQuery = mockDriver.query as unknown as ReturnType<typeof vi.fn>;
    mockQuery.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([{ id: 2 }]);

    const all = await qb.get();
    expect(all).toEqual([{ id: 1 }]);
    expect(mockDriver.query).toHaveBeenCalledWith('SELECT * FROM "users"', []);

    const first = await qb.first();
    expect(first).toEqual({ id: 2 });
    expect(mockDriver.query).toHaveBeenCalledWith('SELECT * FROM "users" LIMIT 1', []);
  });
});
