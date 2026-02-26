import { describe, expect, it } from 'vitest';
import { GaoResponse } from '../src/response.js';

describe('GaoResponse', () => {
  it('should build a successful JSON response with envelope', async () => {
    const resBuilder = new GaoResponse();
    const res = resBuilder.status(201).header('X-Custom', 'Test').json({ id: 1 }, { page: 1 });

    expect(res.status).toBe(201);
    expect(res.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(res.headers.get('X-Custom')).toBe('Test');

    const body = await res.json();
    expect(body).toEqual({
      data: { id: 1 },
      meta: { page: 1 },
    });
  });

  it('should build an error JSON response with envelope', async () => {
    const resBuilder = new GaoResponse();
    const res = resBuilder.error(400, 'VALIDATION_ERROR', 'Invalid email', { field: 'email' });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email',
        details: { field: 'email' },
      },
    });
  });

  it('should construct text response', async () => {
    const resBuilder = new GaoResponse();
    const res = resBuilder.text('Hello World');

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');

    const body = await res.text();
    expect(body).toBe('Hello World');
  });

  it('should construct html response', async () => {
    const resBuilder = new GaoResponse();
    const res = resBuilder.html('<h1>Hi</h1>');

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');

    const body = await res.text();
    expect(body).toBe('<h1>Hi</h1>');
  });

  it('should construct redirect response', () => {
    const resBuilder = new GaoResponse();
    const res = resBuilder.redirect('/login', 301);

    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('/login');
  });

  it('should construct empty 204 response', () => {
    const resBuilder = new GaoResponse();
    const res = resBuilder.empty();

    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });
});
