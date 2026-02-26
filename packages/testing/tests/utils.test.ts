import { describe, it, expect } from 'vitest';
import { request, expectResponse } from '../src/index.js';
import { GaoResponse } from '@gao/http';
import { z } from 'zod';

describe('Testing Utilities', () => {
    it('should build a mock request correctly', () => {
        const req = request('/test')
            .post('/api/users')
            .withBody({ name: 'John' })
            .withHeader('X-Test', 'true')
            .build();

        expect(req.method).toBe('POST');
        expect(req.url.pathname).toBe('/api/users');
        expect(req.header('X-Test')).toBe('true');
        expect(req.body).toEqual({ name: 'John' });
    });

    it('should assert response success correctly', async () => {
        const gaoRes = new GaoResponse();
        const res = gaoRes.json({ foo: 'bar' });

        await expectResponse(res).toBeSuccess();

        const payload = await res.clone().json();
        expect(payload.data).toEqual({ foo: 'bar' });
    });

    it('should validate schemas using assertions', async () => {
        const schema = z.object({
            id: z.string().uuid(),
            name: z.string()
        });

        const gaoRes = new GaoResponse();
        const res = gaoRes.json({
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test'
        });

        await expectResponse(res).toMatchSchema(schema);
    });
});
