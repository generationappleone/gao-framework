import { describe, expect, it, vi } from 'vitest';
import { Table } from '../src/decorators.js';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';
import { BaseModel } from '../src/model.js';
import { BelongsTo, HasMany, HasOne, ManyToMany } from '../src/relations.js';

@Table('users')
class User extends BaseModel {}

@Table('profiles')
class Profile extends BaseModel {}

@Table('posts')
class Post extends BaseModel {}

@Table('roles')
class Role extends BaseModel {}

describe('Model Relations', () => {
  const mockDriver = {
    query: vi.fn(),
    execute: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    transaction: vi.fn(),
  } as unknown as DatabaseDriver;

  it('should generate correct HasOne query', () => {
    const relation = new HasOne(Profile, 'id', 'user_id');
    const qb = relation.query(mockDriver, 'user-123');
    const { sql, params } = qb.toSql();

    expect(sql).toContain('SELECT * FROM "profiles" WHERE "user_id" = $1 LIMIT 1');
    expect(params).toEqual(['user-123']);
  });

  it('should generate correct HasMany query', () => {
    const relation = new HasMany(Post, 'id', 'user_id');
    const qb = relation.query(mockDriver, 'user-123');
    const { sql, params } = qb.toSql();

    expect(sql).toContain('SELECT * FROM "posts" WHERE "user_id" = $1');
    expect(params).toEqual(['user-123']);
  });

  it('should generate correct BelongsTo query', () => {
    const relation = new BelongsTo(User, 'id', 'user_id');
    // localKey='id' points to User's PK
    const qb = relation.query(mockDriver, 'owner-id');
    const { sql, params } = qb.toSql();

    expect(sql).toContain('SELECT * FROM "users" WHERE "id" = $1 LIMIT 1');
    expect(params).toEqual(['owner-id']);
  });

  it('should generate correct ManyToMany query', () => {
    const relation = new ManyToMany(
      Role,
      'id', // localKey (User PK)
      'id', // foreignKey (Role PK)
      'user_roles', // pivot table
      'user_id', // pivot local
      'role_id', // pivot foreign
    );

    const qb = relation.query(mockDriver, 'user-123');
    const { sql, params } = qb.toSql();

    expect(sql).toContain(
      'SELECT * FROM "roles" INNER JOIN "user_roles" ON "roles"."id" = "user_roles"."role_id" WHERE "user_roles"."user_id" = $1',
    );
    expect(params).toEqual(['user-123']);
  });
});
