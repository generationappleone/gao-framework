import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, request, expectResponse, MockDatabase } from '../src/index.js';
import { Schema, BaseModel, SQLiteDriver } from '@gao/orm';
import { GaoResponse } from '@gao/http';
import { z } from 'zod';

// 1. Define a simple Model
class User extends BaseModel {
    public name!: string;
    public email!: string;
}

describe('Framework Integration', () => {
    let app: any;
    let db: MockDatabase;

    beforeAll(async () => {
        // Setup Mock DB
        db = new MockDatabase();
        await db.setup();

        // Create Table
        const driver = db.getConnectionManager().getDriver();
        const createTableSql = Schema.create('users', (t) => {
            t.uuid('id').primary();
            t.string('name');
            t.string('email').unique();
            t.timestamps();
        });
        await driver.execute(createTableSql);

        // Setup App
        app = await createTestApp({
            configOverride: {
                app: { name: 'IntegrationTestApp' }
            }
        });

        // Register a simple Route
        app.router.get('/users', async (req: any, res: GaoResponse) => {
            const users = await driver.query('SELECT * FROM users');
            return res.json(users);
        });

        app.router.post('/users', async (req: any, res: GaoResponse) => {
            await req.parseBody();
            const { name, email } = req.body;

            if (!name || !email) {
                return res.error(400, 'VALIDATION_ERROR', 'Name and email are required');
            }

            const id = crypto.randomUUID();
            await driver.execute(
                'INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)',
                [id, name, email, new Date().toISOString()]
            );

            return res.status(201).json({ id, name, email });
        });
    });

    afterAll(async () => {
        await db.teardown();
        if (app) await app.shutdown();
    });

    it('should start with an empty user list', async () => {
        const req = request('/users').get('/users').build();
        const match = app.router.match(req.method, req.url.pathname);
        const gaoRes = new GaoResponse();
        const res = await match.handler(req, gaoRes);

        await expectResponse(res).toBeSuccess();
        const payload: any = await res.json();
        expect(payload.data).toEqual([]);
    });

    it('should create a new user', async () => {
        const userData = { name: 'Alice', email: 'alice@example.com' };
        const req = request('/users').post('/users').withBody(userData).build();
        const match = app.router.match(req.method, req.url.pathname);
        const gaoRes = new GaoResponse();
        const res = await match.handler(req, gaoRes);

        await expectResponse(res).toBeSuccess(201);
        const payload: any = await res.json();
        expect(payload.data.name).toBe('Alice');
        expect(payload.data.id).toBeDefined();
    });

    it('should return error for invalid data', async () => {
        const req = request('/users').post('/users').withBody({ name: 'Bob' }).build();
        const match = app.router.match(req.method, req.url.pathname);
        const gaoRes = new GaoResponse();
        const res = await match.handler(req, gaoRes);

        await expectResponse(res).toBeError(400, 'VALIDATION_ERROR');
    });

    it('should list users after creation', async () => {
        const req = request('/users').get('/users').build();
        const match = app.router.match(req.method, req.url.pathname);
        const gaoRes = new GaoResponse();
        const res = await match.handler(req, gaoRes);

        await expectResponse(res).toBeSuccess();
        const payload: any = await res.json();
        expect(payload.data.length).toBe(1);
        expect(payload.data[0].name).toBe('Alice');
    });
});
