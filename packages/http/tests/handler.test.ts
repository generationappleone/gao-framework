/**
 * @gao/http — Router Integration Tests
 *
 * Tests for createHttpHandler: controller DI, middleware pipeline,
 * validation auto-wiring, and route matching.
 */

import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Container } from '@gao/core';
import { GaoRequest } from '../src/request.js';
import { GaoResponse } from '../src/response.js';
import { Controller, Get, Post } from '../src/decorators.js';
import { Validate } from '../src/validation.js';
import { createHttpHandler } from '../src/handler.js';
import { bodyParserMiddleware } from '../src/middlewares/body-parser.js';
import { errorHandlerMiddleware } from '../src/middlewares/error-handler.middleware.js';
import { z } from 'zod';

// ─── Test Controller ────────────────────────────────────────────

@Controller('/api/items')
class ItemController {
    @Get('/')
    async list(req: GaoRequest, res: GaoResponse) {
        return res.json([{ id: 1, name: 'Item 1' }]);
    }

    @Get('/:id')
    async show(req: GaoRequest, res: GaoResponse) {
        return res.json({ id: req.params.id });
    }

    @Post('/')
    @Validate(z.object({ name: z.string().min(1) }))
    async create(req: GaoRequest, res: GaoResponse) {
        const data = req.validated<{ name: string }>();
        return res.status(201).json({ name: data.name });
    }
}

// ─── Helper ──────────────────────────────────────────────────────

function makeRequest(method: string, url: string, body?: unknown) {
    const headers = new Headers();
    const init: RequestInit = { method, headers };
    if (body) {
        headers.set('Content-Type', 'application/json');
        init.body = JSON.stringify(body);
    }
    const raw = new Request(url, init);
    return new GaoRequest(raw);
}

// ─── Tests ───────────────────────────────────────────────────────

describe('createHttpHandler', () => {
    it('routes GET requests to correct handler', async () => {
        const handler = createHttpHandler({
            controllers: [ItemController],
        });

        const req = makeRequest('GET', 'http://localhost/api/items');
        const res = new GaoResponse();
        const response = await handler(req, res);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.data).toEqual([{ id: 1, name: 'Item 1' }]);
    });

    it('extracts route params from :id', async () => {
        const handler = createHttpHandler({
            controllers: [ItemController],
        });

        const req = makeRequest('GET', 'http://localhost/api/items/42');
        const res = new GaoResponse();
        const response = await handler(req, res);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.data.id).toBe('42');
    });

    it('returns 404 for unmatched routes', async () => {
        const handler = createHttpHandler({
            controllers: [ItemController],
        });

        const req = makeRequest('GET', 'http://localhost/api/nonexistent');
        const res = new GaoResponse();
        const response = await handler(req, res);

        expect(response.status).toBe(404);
    });

    it('auto-validates @Validate() decorated handlers', async () => {
        const handler = createHttpHandler({
            controllers: [ItemController],
            middlewares: [
                errorHandlerMiddleware(),
                bodyParserMiddleware(),
            ],
        });

        // Invalid body — missing name
        const req = makeRequest('POST', 'http://localhost/api/items', { name: '' });
        const res = new GaoResponse();
        const response = await handler(req, res);

        expect(response.status).toBe(422);
    });

    it('passes validated data to handler on valid request', async () => {
        const handler = createHttpHandler({
            controllers: [ItemController],
            middlewares: [
                bodyParserMiddleware(),
            ],
        });

        const req = makeRequest('POST', 'http://localhost/api/items', { name: 'New Item' });
        const res = new GaoResponse();
        const response = await handler(req, res);

        expect(response.status).toBe(201);
        const body = await response.json();
        expect(body.data.name).toBe('New Item');
    });

    it('works with DI Container', async () => {
        const container = new Container();
        const handler = createHttpHandler({
            container,
            controllers: [ItemController],
        });

        const req = makeRequest('GET', 'http://localhost/api/items');
        const res = new GaoResponse();
        const response = await handler(req, res);

        expect(response.status).toBe(200);
    });
});
