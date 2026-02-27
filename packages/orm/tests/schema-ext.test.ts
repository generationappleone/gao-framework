/**
 * @gao/orm — Schema Builder Extensions Tests
 */

import { describe, it, expect } from 'vitest';
import { Schema, ColumnBuilder, TableBuilder, AlterTableBuilder } from '../src/schema.js';

describe('Schema Builder Extensions', () => {
    // ─── New Column Types ────────────────────────────────────────

    describe('decimal / numeric', () => {
        it('generates DECIMAL with precision and scale', () => {
            const sql = Schema.create('products', (t) => {
                t.uuid('id').primary();
                t.decimal('price', 10, 2);
            });
            expect(sql).toContain('"price" DECIMAL(10, 2) NOT NULL');
        });

        it('generates NUMERIC with defaults', () => {
            const sql = Schema.create('items', (t) => {
                t.uuid('id').primary();
                t.numeric('amount');
            });
            expect(sql).toContain('"amount" NUMERIC(10, 2) NOT NULL');
        });
    });

    describe('json / jsonb', () => {
        it('generates JSON column', () => {
            const sql = Schema.create('configs', (t) => {
                t.uuid('id').primary();
                t.json('settings');
            });
            expect(sql).toContain('"settings" JSON NOT NULL');
        });

        it('generates JSONB column', () => {
            const sql = Schema.create('analytics', (t) => {
                t.uuid('id').primary();
                t.jsonb('metadata').nullable();
            });
            expect(sql).toContain('"metadata" JSONB');
        });
    });

    describe('date / time', () => {
        it('generates DATE column', () => {
            const sql = Schema.create('events', (t) => {
                t.uuid('id').primary();
                t.date('event_date');
            });
            expect(sql).toContain('"event_date" DATE NOT NULL');
        });

        it('generates TIME column', () => {
            const sql = Schema.create('schedules', (t) => {
                t.uuid('id').primary();
                t.time('start_time');
            });
            expect(sql).toContain('"start_time" TIME NOT NULL');
        });
    });

    describe('serial / bigserial', () => {
        it('generates SERIAL column', () => {
            const sql = Schema.create('counters', (t) => {
                t.serial('id').primary();
                t.string('name');
            });
            expect(sql).toContain('"id" SERIAL PRIMARY KEY');
        });

        it('generates BIGSERIAL column', () => {
            const sql = Schema.create('logs', (t) => {
                t.bigserial('id').primary();
            });
            expect(sql).toContain('"id" BIGSERIAL PRIMARY KEY');
        });
    });

    // ─── Enum ────────────────────────────────────────────────────

    describe('enum', () => {
        it('generates VARCHAR with CHECK constraint', () => {
            const sql = Schema.create('tasks', (t) => {
                t.uuid('id').primary();
                t.enum('status', ['pending', 'active', 'completed']);
            });
            expect(sql).toContain('"status" VARCHAR(255) NOT NULL');
            expect(sql).toContain("CHECK (\"status\" IN ('pending', 'active', 'completed'))");
        });
    });

    // ─── Timestamps ──────────────────────────────────────────────

    describe('timestamps()', () => {
        it('adds created_at, updated_at, deleted_at', () => {
            const sql = Schema.create('posts', (t) => {
                t.uuid('id').primary();
                t.timestamps();
            });
            expect(sql).toContain('"created_at" TIMESTAMP');
            expect(sql).toContain('DEFAULT CURRENT_TIMESTAMP');
            expect(sql).toContain('"updated_at" TIMESTAMP');
            expect(sql).toContain('"deleted_at" TIMESTAMP');
        });
    });

    // ─── Foreign Keys ────────────────────────────────────────────

    describe('foreignKey', () => {
        it('generates FOREIGN KEY constraint', () => {
            const sql = Schema.create('comments', (t) => {
                t.uuid('id').primary();
                t.uuid('post_id');
                t.foreignKey('post_id', 'posts', 'id', 'CASCADE');
            });
            expect(sql).toContain('CONSTRAINT "fk_comments_post_id"');
            expect(sql).toContain('FOREIGN KEY ("post_id") REFERENCES "posts"("id")');
            expect(sql).toContain('ON DELETE CASCADE');
        });
    });

    // ─── Indexes ─────────────────────────────────────────────────

    describe('index', () => {
        it('generates CREATE INDEX statement', () => {
            const sql = Schema.create('users', (t) => {
                t.uuid('id').primary();
                t.string('email').unique();
                t.index('email');
            });
            expect(sql).toContain('CREATE INDEX "idx_email" ON "users" ("email")');
        });

        it('generates composite index', () => {
            const sql = Schema.create('logs', (t) => {
                t.uuid('id').primary();
                t.string('type');
                t.timestamp('created_at');
                t.index(['type', 'created_at'], 'idx_type_date');
            });
            expect(sql).toContain('CREATE INDEX "idx_type_date" ON "logs" ("type", "created_at")');
        });

        it('generates unique index', () => {
            const sql = Schema.create('profiles', (t) => {
                t.uuid('id').primary();
                t.string('slug');
                t.uniqueIndex('slug');
            });
            expect(sql).toContain('CREATE UNIQUE INDEX');
        });
    });

    // ─── Check Constraints ──────────────────────────────────────

    describe('check', () => {
        it('generates CHECK constraint', () => {
            const sql = Schema.create('products', (t) => {
                t.uuid('id').primary();
                t.decimal('price');
                t.check('"price" > 0', 'chk_price_positive');
            });
            expect(sql).toContain('CONSTRAINT "chk_price_positive" CHECK ("price" > 0)');
        });
    });

    // ─── Schema.alter ────────────────────────────────────────────

    describe('Schema.alter', () => {
        it('adds column', () => {
            const statements = Schema.alter('users', (t) => {
                t.addColumn(new ColumnBuilder('phone', 'varchar', 20));
            });
            expect(statements[0]).toContain('ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(20)');
        });

        it('drops column', () => {
            const statements = Schema.alter('users', (t) => {
                t.dropColumn('middle_name');
            });
            expect(statements[0]).toContain('ALTER TABLE "users" DROP COLUMN "middle_name"');
        });

        it('renames column', () => {
            const statements = Schema.alter('users', (t) => {
                t.renameColumn('name', 'full_name');
            });
            expect(statements[0]).toContain('RENAME COLUMN "name" TO "full_name"');
        });

        it('adds foreign key', () => {
            const statements = Schema.alter('posts', (t) => {
                t.addForeignKey('author_id', 'users');
            });
            expect(statements[0]).toContain('ADD CONSTRAINT "fk_posts_author_id"');
            expect(statements[0]).toContain('FOREIGN KEY ("author_id") REFERENCES "users"("id")');
        });
    });

    // ─── Schema.drop / dropIfExists / rename ─────────────────────

    describe('static methods', () => {
        it('drop generates DROP TABLE', () => {
            expect(Schema.drop('users')).toBe('DROP TABLE IF EXISTS "users";');
        });

        it('dropIfExists generates CASCADE drop', () => {
            expect(Schema.dropIfExists('users')).toBe('DROP TABLE IF EXISTS "users" CASCADE;');
        });

        it('rename generates ALTER TABLE RENAME', () => {
            expect(Schema.rename('old', 'new')).toBe('ALTER TABLE "old" RENAME TO "new";');
        });
    });
});
