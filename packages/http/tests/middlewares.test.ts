/**
 * @gao/http — Middleware Tests
 *
 * Tests for all built-in middleware factory functions.
 */

import { describe, it, expect, vi } from 'vitest';
import { GaoRequest } from '../src/request.js';
import { GaoResponse } from '../src/response.js';
import { MiddlewarePipeline } from '../src/middleware.js';
import { bodyParserMiddleware } from '../src/middlewares/body-parser.js';
import { corsMiddleware } from '../src/middlewares/cors.js';
import { sessionMiddleware } from '../src/middlewares/session.middleware.js';
import { flashMiddleware } from '../src/middlewares/flash.middleware.js';
import { errorHandlerMiddleware } from '../src/middlewares/error-handler.middleware.js';

function makeReq(method = 'GET', url = 'http://localhost/', headers: Record<string, string> = {}): GaoRequest {
    const h = new Headers(headers);
    const init: RequestInit = { method, headers: h };
    if (method !== 'GET' && method !== 'HEAD') {
        init.body = JSON.stringify({ name: 'test' });
        h.set('content-type', 'application/json');
    }
    const raw = new Request(url, init);
    return new GaoRequest(raw);
}

// ─── Body Parser Middleware ─────────────────────────────────────

describe('bodyParserMiddleware', () => {
    it('parses JSON body for POST requests', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(bodyParserMiddleware());

        const req = makeReq('POST');
        const res = new GaoResponse();

        await pipeline.execute(req, res, async (r) => {
            expect(r.body).toEqual({ name: 'test' });
            return res.json({ ok: true });
        });
    });

    it('skips parsing for GET requests', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(bodyParserMiddleware());

        const req = makeReq('GET');
        const res = new GaoResponse();

        const parseSpy = vi.spyOn(req, 'parseBody');

        await pipeline.execute(req, res, async () => {
            expect(parseSpy).not.toHaveBeenCalled();
            return res.json({ ok: true });
        });
    });
});

// ─── CORS Middleware ────────────────────────────────────────────

describe('corsMiddleware', () => {
    it('sets CORS headers when origin matches', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(corsMiddleware({ origin: 'http://localhost:5173' }));

        const req = makeReq('GET', 'http://localhost/', { origin: 'http://localhost:5173' });
        const res = new GaoResponse();

        const response = await pipeline.execute(req, res, async (_r, r2) => {
            return r2.json({ ok: true });
        });

        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
        expect(response.headers.get('Vary')).toBe('Origin');
    });

    it('does not set CORS headers when origin does not match', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(corsMiddleware({ origin: 'http://allowed.com' }));

        const req = makeReq('GET', 'http://localhost/', { origin: 'http://evil.com' });
        const res = new GaoResponse();

        const response = await pipeline.execute(req, res, async (_r, r2) => {
            return r2.json({ ok: true });
        });

        expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('handles OPTIONS preflight with 204', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(corsMiddleware({ origin: '*' }));

        const req = makeReq('OPTIONS', 'http://localhost/', { origin: 'http://any.com' });
        // Override method since makeReq sets body for non-GET
        const raw = new Request('http://localhost/', {
            method: 'OPTIONS',
            headers: { origin: 'http://any.com' },
        });
        const optReq = new GaoRequest(raw);
        const res = new GaoResponse();

        const response = await pipeline.execute(optReq, res, async (_r, r2) => {
            return r2.json({ should: 'not reach' });
        });

        expect(response.status).toBe(204);
        expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    });

    it('supports array of origins', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(corsMiddleware({ origin: ['http://a.com', 'http://b.com'] }));

        const req = makeReq('GET', 'http://localhost/', { origin: 'http://b.com' });
        const res = new GaoResponse();

        const response = await pipeline.execute(req, res, async (_r, r2) => r2.json({}));
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://b.com');
    });

    it('supports function-based origin', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(corsMiddleware({ origin: (o) => o.endsWith('.myapp.com') }));

        const req = makeReq('GET', 'http://localhost/', { origin: 'http://api.myapp.com' });
        const res = new GaoResponse();

        const response = await pipeline.execute(req, res, async (_r, r2) => r2.json({}));
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://api.myapp.com');
    });
});

// ─── Session Middleware ─────────────────────────────────────────

describe('sessionMiddleware', () => {
    it('creates a new session when no cookie exists', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(sessionMiddleware());

        const req = makeReq('GET');
        const res = new GaoResponse();

        const response = await pipeline.execute(req, res, async (r, r2) => {
            expect(r.session).toBeDefined();
            expect(r.session!.isNew).toBe(true);
            r.session!.set('userId', 42);
            return r2.json({ ok: true });
        });

        // Should have Set-Cookie header
        expect(response.headers.get('Set-Cookie')).toContain('gao_session=');
    });

    it('loads existing session from cookie', async () => {
        // First request: create session
        const pipeline1 = new MiddlewarePipeline();
        pipeline1.use(sessionMiddleware());

        const req1 = makeReq('GET');
        const res1 = new GaoResponse();
        let sessionId = '';

        const response1 = await pipeline1.execute(req1, res1, async (r, r2) => {
            r.session!.set('userId', 42);
            sessionId = r.session!.id;
            return r2.json({});
        });

        const cookie = response1.headers.get('Set-Cookie')!;
        expect(cookie).toContain(sessionId);
    });
});

// ─── Flash Middleware ───────────────────────────────────────────

describe('flashMiddleware', () => {
    it('attaches flash to request when session exists', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(sessionMiddleware());
        pipeline.use(flashMiddleware());

        const req = makeReq('GET');
        const res = new GaoResponse();

        await pipeline.execute(req, res, async (r, r2) => {
            expect(r.flash).toBeDefined();
            r.flash!.flash('success', 'Saved!');
            return r2.json({});
        });
    });

    it('does not crash when no session middleware is present', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(flashMiddleware());

        const req = makeReq('GET');
        const res = new GaoResponse();

        const response = await pipeline.execute(req, res, async (r, r2) => {
            expect(r.flash).toBeUndefined();
            return r2.json({ ok: true });
        });

        expect(response.status).toBe(200);
    });
});

// ─── Error Handler Middleware ───────────────────────────────────

describe('errorHandlerMiddleware', () => {
    it('catches errors and returns error response', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(errorHandlerMiddleware());

        const req = makeReq('GET');
        const res = new GaoResponse();

        const response = await pipeline.execute(req, res, async () => {
            throw new Error('Something went wrong');
        });

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBeDefined();
    });

    it('passes through successful responses', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(errorHandlerMiddleware());

        const req = makeReq('GET');
        const res = new GaoResponse();

        const response = await pipeline.execute(req, res, async (_r, r2) => {
            return r2.json({ ok: true });
        });

        expect(response.status).toBe(200);
    });
});

// ─── Pipeline Composition ───────────────────────────────────────

describe('Middleware Pipeline Composition', () => {
    it('composes all middlewares in correct order', async () => {
        const pipeline = new MiddlewarePipeline();
        pipeline.use(errorHandlerMiddleware());
        pipeline.use(corsMiddleware({ origin: '*' }));
        pipeline.use(bodyParserMiddleware());
        pipeline.use(sessionMiddleware());
        pipeline.use(flashMiddleware());

        const h = new Headers();
        h.set('content-type', 'application/json');
        h.set('origin', 'http://test.com');
        const raw = new Request('http://localhost/', {
            method: 'POST',
            headers: h,
            body: JSON.stringify({ name: 'Full Pipeline' }),
        });
        const req = new GaoRequest(raw);
        const res = new GaoResponse();

        const response = await pipeline.execute(req, res, async (r, r2) => {
            // Body parsed
            expect(r.body).toEqual({ name: 'Full Pipeline' });
            // Session created
            expect(r.session).toBeDefined();
            // Flash available
            expect(r.flash).toBeDefined();

            return r2.json({ success: true });
        });

        // CORS headers set
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
        // Session cookie set
        expect(response.headers.get('Set-Cookie')).toContain('gao_session=');
        // Status OK
        expect(response.status).toBe(200);
    });
});
