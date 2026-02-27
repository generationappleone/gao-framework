/**
 * @gao/orm — Active Record Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Model, setModelDriver, ModelQueryBuilder } from '../src/active-record.js';
import { Table, Column, ForeignKey } from '../src/decorators.js';
import { BeforeSave, AfterSave } from '../src/hooks.js';
import type { DatabaseDriver } from '../src/drivers/driver.interface.js';

function createMockDriver(): DatabaseDriver {
    return {
        connect: vi.fn(),
        disconnect: vi.fn(),
        query: vi.fn().mockResolvedValue([]),
        execute: vi.fn().mockResolvedValue({ rowCount: 1, rows: [] }),
        transaction: vi.fn(),
    } as any;
}

// Define test models
@Table('users')
class User extends Model {
    @Column() name!: string;
    @Column() email!: string;
    @Column() role!: string;
}

@Table('posts')
class Post extends Model {
    @Column() title!: string;
    @Column() body!: string;
    @Column() user_id!: string;
}

describe('Active Record — Model', () => {
    let driver: DatabaseDriver;

    beforeEach(() => {
        driver = createMockDriver();
        setModelDriver(driver, 'postgres');
    });

    // ─── Static: find ────────────────────────────────────────────

    describe('Model.find()', () => {
        it('returns hydrated instance when found', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice', email: 'alice@test.com', role: 'admin' },
            ]);
            const user = await User.find('uuid-1');
            expect(user).not.toBeNull();
            expect(user!.id).toBe('uuid-1');
            expect(user!.name).toBe('Alice');
            expect(user!.email).toBe('alice@test.com');
        });

        it('returns null when not found', async () => {
            (driver.query as any).mockResolvedValue([]);
            const user = await User.find('nonexistent');
            expect(user).toBeNull();
        });

        it('instance is not marked as new', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice', email: 'alice@test.com' },
            ]);
            const user = await User.find('uuid-1');
            expect(user!.isDirty()).toBe(false);
        });
    });

    describe('Model.findOrFail()', () => {
        it('throws when not found', async () => {
            (driver.query as any).mockResolvedValue([]);
            await expect(User.findOrFail('nonexistent')).rejects.toThrow("not found");
        });
    });

    // ─── Static: all ─────────────────────────────────────────────

    describe('Model.all()', () => {
        it('returns all records excluding soft-deleted', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice' },
                { id: 'uuid-2', name: 'Bob' },
            ]);
            const users = await User.all();
            expect(users).toHaveLength(2);
            expect(users[0]!.name).toBe('Alice');
            // Verify whereNull('deleted_at') was used
            const calledSql = (driver.query as any).mock.calls[0][0] as string;
            expect(calledSql).toContain('IS NULL');
        });
    });

    // ─── Static: where ───────────────────────────────────────────

    describe('Model.where()', () => {
        it('returns chainable ModelQueryBuilder', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice', role: 'admin' },
            ]);
            const users = await User.where('role', 'admin').get();
            expect(users).toHaveLength(1);
            expect(users[0]!.name).toBe('Alice');
        });

        it('supports operator', async () => {
            (driver.query as any).mockResolvedValue([]);
            await User.where('role', '!=', 'guest').get();
            const calledSql = (driver.query as any).mock.calls[0][0] as string;
            expect(calledSql).toContain('!=');
        });
    });

    // ─── Static: create ──────────────────────────────────────────

    describe('Model.create()', () => {
        it('creates and saves a new instance', async () => {
            const user = await User.create({ name: 'Charlie', email: 'charlie@test.com', role: 'user' });
            expect(user.name).toBe('Charlie');
            expect(user.id).toBeDefined();
            expect(driver.execute).toHaveBeenCalled();

            const calledSql = (driver.execute as any).mock.calls[0][0] as string;
            expect(calledSql).toContain('INSERT INTO "users"');
        });
    });

    // ─── Instance: save (INSERT) ─────────────────────────────────

    describe('instance.save() — INSERT', () => {
        it('inserts new record', async () => {
            const user = new User();
            user.fill({ name: 'Dave', email: 'dave@test.com', role: 'user' });
            await user.save();

            expect(driver.execute).toHaveBeenCalled();
            const calledSql = (driver.execute as any).mock.calls[0][0] as string;
            expect(calledSql).toContain('INSERT INTO "users"');
        });

        it('auto-generates id and timestamps', async () => {
            const user = new User();
            user.fill({ name: 'Eve' });
            await user.save();

            expect(user.id).toBeDefined();
            expect(user.created_at).toBeDefined();
            expect(user.updated_at).toBeDefined();
        });
    });

    // ─── Instance: save (UPDATE) ─────────────────────────────────

    describe('instance.save() — UPDATE', () => {
        it('updates only dirty fields', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice', email: 'alice@test.com', role: 'admin' },
            ]);
            const user = await User.find('uuid-1');
            user!.name = 'Alice Updated';
            await user!.save();

            const calledSql = (driver.execute as any).mock.calls[0][0] as string;
            expect(calledSql).toContain('UPDATE "users" SET');
            expect(calledSql).toContain('"name"');
        });

        it('skips update when nothing changed', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice' },
            ]);
            const user = await User.find('uuid-1');
            await user!.save();
            expect(driver.execute).not.toHaveBeenCalled();
        });
    });

    // ─── Instance: destroy ───────────────────────────────────────

    describe('instance.destroy()', () => {
        it('soft deletes by default', async () => {
            (driver.query as any).mockResolvedValue([{ id: 'uuid-1', name: 'Alice' }]);
            const user = await User.find('uuid-1');
            await user!.destroy();

            const calledSql = (driver.execute as any).mock.calls[0][0] as string;
            expect(calledSql).toContain('UPDATE "users" SET');
            expect(calledSql).toContain('"deleted_at"');
        });

        it('hard deletes with force option', async () => {
            (driver.query as any).mockResolvedValue([{ id: 'uuid-1', name: 'Alice' }]);
            const user = await User.find('uuid-1');
            await user!.destroy({ force: true });

            const calledSql = (driver.execute as any).mock.calls[0][0] as string;
            expect(calledSql).toContain('DELETE FROM "users"');
        });
    });

    // ─── Instance: refresh ───────────────────────────────────────

    describe('instance.refresh()', () => {
        it('re-fetches from database', async () => {
            (driver.query as any)
                .mockResolvedValueOnce([{ id: 'uuid-1', name: 'Alice' }])
                .mockResolvedValueOnce([{ id: 'uuid-1', name: 'Alice Updated' }]);

            const user = await User.find('uuid-1');
            expect(user!.name).toBe('Alice');

            await user!.refresh();
            expect(user!.name).toBe('Alice Updated');
        });
    });

    // ─── Dirty Tracking ──────────────────────────────────────────

    describe('dirty tracking', () => {
        it('detects changes', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice', email: 'alice@test.com' },
            ]);
            const user = await User.find('uuid-1');
            expect(user!.isDirty()).toBe(false);

            user!.name = 'Alice Updated';
            expect(user!.isDirty()).toBe(true);
            expect(user!.isDirty('name')).toBe(true);
            expect(user!.isDirty('email')).toBe(false);
        });

        it('getDirty returns only changed fields', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice', email: 'alice@test.com' },
            ]);
            const user = await User.find('uuid-1');
            user!.name = 'Alice Updated';

            const dirty = user!.getDirty();
            expect(dirty).toHaveProperty('name', 'Alice Updated');
            expect(dirty).not.toHaveProperty('email');
        });
    });

    // ─── Hydration ───────────────────────────────────────────────

    describe('Model.hydrate()', () => {
        it('creates instance from raw row', () => {
            const user = User.hydrate({ id: 'uuid-1', name: 'Test', email: 'test@test.com' });
            expect(user.id).toBe('uuid-1');
            expect(user.name).toBe('Test');
            expect(user.isDirty()).toBe(false);
        });
    });

    // ─── toJSON ──────────────────────────────────────────────────

    describe('toJSON()', () => {
        it('returns attributes without private fields', () => {
            const user = User.hydrate({ id: 'uuid-1', name: 'Test', email: 'test@test.com' });
            const json = user.toJSON();
            expect(json.id).toBe('uuid-1');
            expect(json.name).toBe('Test');
            expect(json).not.toHaveProperty('_originalAttributes');
            expect(json).not.toHaveProperty('_isNew');
        });
    });

    // ─── ModelQueryBuilder ───────────────────────────────────────

    describe('ModelQueryBuilder', () => {
        it('chains where + orderBy + limit', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice', role: 'admin' },
            ]);
            const users = await User.where('role', 'admin')
                .orderBy('name', 'ASC')
                .limit(10)
                .get();
            expect(users).toHaveLength(1);
        });

        it('.first() returns single instance', async () => {
            (driver.query as any).mockResolvedValue([
                { id: 'uuid-1', name: 'Alice' },
            ]);
            const user = await User.where('role', 'admin').first();
            expect(user).not.toBeNull();
            expect(user!.name).toBe('Alice');
        });

        it('.first() returns null when empty', async () => {
            (driver.query as any).mockResolvedValue([]);
            const user = await User.where('role', 'nonexistent').first();
            expect(user).toBeNull();
        });

        it('.count() returns number', async () => {
            (driver.query as any).mockResolvedValue([{ aggregate: '42' }]);
            const count = await User.where('role', 'admin').count();
            expect(count).toBe(42);
        });

        it('.exists() returns boolean', async () => {
            (driver.query as any).mockResolvedValue([{ '?column?': 1 }]);
            const exists = await User.where('email', 'alice@test.com').exists();
            expect(exists).toBe(true);
        });
    });
});
