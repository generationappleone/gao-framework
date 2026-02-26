import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { GaoRequest } from '../src/request.js';
import type { GaoResponse } from '../src/response.js';
import { Server } from '../src/server.js';

describe('HTTP Server', () => {
  let server: Server;
  let url: string;
  const PORT = 3050; // Use a different port to avoid conflicts

  // Provide a simple handler
  const handler = async (req: GaoRequest, res: GaoResponse) => {
    if (req.method === 'GET' && req.url.pathname === '/hello') {
      return res.status(200).json({ msg: 'world' });
    }
    if (req.method === 'POST') {
      await req.parseBody();
      return res.json({ body: req.body });
    }
    if (req.method === 'GET' && req.url.pathname === '/timeout') {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return res.status(200).json({ msg: 'late' });
    }
    return res.status(404).text('Not Found');
  };

  beforeAll(async () => {
    server = new Server(handler, { port: PORT, hostname: '127.0.0.1', timeout: 500 });
    await server.listen();
    url = `http://127.0.0.1:${PORT}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should correctly handle GET requests across Node.js', async () => {
    const response = await fetch(`${url}/hello`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toEqual({ data: { msg: 'world' } });
  });

  it('should correctly handle POST requests across Node.js and parse body', async () => {
    const response = await fetch(`${url}/echo`, {
      method: 'POST',
      body: JSON.stringify({ test: 123 }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ data: { body: { test: 123 } } });
  });

  it('should return 404 for unknown endpoints', async () => {
    const response = await fetch(`${url}/unknown`);
    expect(response.status).toBe(404);

    const text = await response.text();
    expect(text).toBe('Not Found');
  });

  it('should return 408 if request times out', async () => {
    // Our handler takes 600ms, server timeout is 500ms
    const response = await fetch(`${url}/timeout`);

    expect(response.status).toBe(408);
    const data = await response.json();
    expect(data.error.code).toBe('REQUEST_TIMEOUT');
  });
});
