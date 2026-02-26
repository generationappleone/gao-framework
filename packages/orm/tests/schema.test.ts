import { describe, expect, it } from 'vitest';
import { Schema } from '../src/schema.js';

describe('Schema Builder', () => {
  it('should generate a simple string CREATE TABLE statement', () => {
    const sql = Schema.create('users', (t) => {
      t.uuid('id').primary();
      t.string('name', 100);
      t.string('email').unique();
    });

    expect(sql).toContain('CREATE TABLE "users"');
    expect(sql).toContain('"id" UUID PRIMARY KEY');
    expect(sql).toContain('"name" VARCHAR(100) NOT NULL');
    expect(sql).toContain('"email" VARCHAR(255) NOT NULL UNIQUE');
  });

  it('should correctly handle defaults and timestamps', () => {
    const sql = Schema.create('posts', (t) => {
      t.integer('id').primary();
      t.boolean('is_published').default(false);
      t.timestamps();
    });

    expect(sql).toContain('"is_published" BOOLEAN NOT NULL DEFAULT false');
    expect(sql).toContain('"created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    expect(sql).toContain('"updated_at" TIMESTAMP'); // nullable skips NOT NULL
  });

  it('should generate a DROP TABLE statement', () => {
    const sql = Schema.drop('users');
    expect(sql).toBe('DROP TABLE IF EXISTS "users";');
  });
});
