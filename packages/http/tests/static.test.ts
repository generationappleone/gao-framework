import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GaoRequest } from '../src/request.js';
import { serveStatic } from '../src/static.js';

describe('Static File Serving', () => {
  const rootDir = path.join(process.cwd(), 'tests', 'fixtures', 'public');

  beforeAll(async () => {
    await fs.mkdir(rootDir, { recursive: true });
    await fs.writeFile(path.join(rootDir, 'test.txt'), 'Hello Static');
    await fs.writeFile(path.join(rootDir, 'test.json'), '{"key":"value"}');
  });

  afterAll(async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });

  it('should serve a static text file', async () => {
    const req = new GaoRequest(new Request('http://localhost/test.txt'));
    const response = await serveStatic(req, { root: rootDir, stream: false });

    expect(response).not.toBeNull();
    expect(response!.status).toBe(200);
    expect(response!.headers.get('content-type')).toBe('text/plain');

    const text = await response!.text();
    expect(text).toBe('Hello Static');
  });

  it('should calculate Etag and return Cache-Control', async () => {
    const req = new GaoRequest(new Request('http://localhost/test.txt'));
    const response = await serveStatic(req, { root: rootDir, maxAge: 3600, stream: false });

    expect(response!.headers.get('cache-control')).toBe('public, max-age=3600');

    const etag = response!.headers.get('etag');
    expect(etag).toBeDefined();

    // Simulate request with matching etag
    const req2 = new GaoRequest(
      new Request('http://localhost/test.txt', {
        headers: { 'if-none-match': etag! },
      }),
    );
    const response2 = await serveStatic(req2, { root: rootDir });
    expect(response2!.status).toBe(204); // Using empty() which corresponds to 204 or no content buffer
  });

  it('should return null for non-existing files (allowing router to 404)', async () => {
    const req = new GaoRequest(new Request('http://localhost/non-existing.png'));
    const response = await serveStatic(req, { root: rootDir });

    expect(response).toBeNull();
  });

  it('should prevent directory traversal attacks', async () => {
    const req = new GaoRequest(new Request('http://localhost/'));
    // Manually forge the pathname to simulate raw TCP socket requests that bypass native URL parse
    Object.defineProperty(req, 'url', { value: { pathname: '../../../../etc/passwd' } });
    const response = await serveStatic(req, { root: rootDir });

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
  });

  it('should forbid directory listing', async () => {
    const req = new GaoRequest(new Request('http://localhost/'));
    // Make 'index.html' point to a directory intentionally or just try mapping a dir
    const response = await serveStatic(new GaoRequest(new Request('http://localhost/')), {
      root: rootDir,
      index: '.',
    });

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
  });

  it('should match prefix properly', async () => {
    const req = new GaoRequest(new Request('http://localhost/assets/test.txt'));
    const response = await serveStatic(req, { root: rootDir, prefix: '/assets', stream: false });

    expect(response).not.toBeNull();
    expect(response!.status).toBe(200);

    const text = await response!.text();
    expect(text).toBe('Hello Static');
  });

  it('should properly use stream mode by default', async () => {
    const req = new GaoRequest(new Request('http://localhost/test.json'));
    const response = await serveStatic(req, { root: rootDir }); // default stream = true

    expect(response).not.toBeNull();
    expect(response!.status).toBe(200);
    expect(response!.headers.get('content-type')).toBe('application/json');

    const json = await response!.json();
    expect(json).toEqual({ key: 'value' });
  });
});
