import { describe, expect, it, vi } from 'vitest';
import { GaoRequest } from '../src/request.js';

describe('GaoRequest', () => {
  it('should parse URL and query parameters correctly', () => {
    const nativeReq = new Request('http://localhost:3000/api/users?status=active&sort=desc');
    const req = new GaoRequest(nativeReq);

    expect(req.method).toBe('GET');
    expect(req.url.pathname).toBe('/api/users');
    expect(req.query).toEqual({ status: 'active', sort: 'desc' });
    expect(req.correlationId).toBeDefined();
  });

  it('should extract x-correlation-id from headers if present', () => {
    const nativeReq = new Request('http://localhost:3000/', {
      headers: { 'x-correlation-id': 'custom-id-123' },
    });
    const req = new GaoRequest(nativeReq);

    expect(req.correlationId).toBe('custom-id-123');
  });

  it('should extract x-forwarded-for IP if present', () => {
    const nativeReq = new Request('http://localhost:3000/', {
      headers: { 'x-forwarded-for': '192.168.1.100, 10.0.0.1' },
    });
    const req = new GaoRequest(nativeReq, '127.0.0.1');

    expect(req.ip).toBe('192.168.1.100');
  });

  it('should use fallback IP if no header', () => {
    const nativeReq = new Request('http://localhost:3000/');
    const req = new GaoRequest(nativeReq, '10.0.0.5');

    expect(req.ip).toBe('10.0.0.5');
  });

  it('should parse application/json body', async () => {
    const nativeReq = new Request('http://localhost:3000/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', age: 30 }),
    });
    const req = new GaoRequest(nativeReq);

    await req.parseBody();

    expect(req.body).toEqual({ name: 'Alice', age: 30 });
  });

  it('should parse application/x-www-form-urlencoded body', async () => {
    const nativeReq = new Request('http://localhost:3000/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'name=Bob&role=admin',
    });
    const req = new GaoRequest(nativeReq);

    await req.parseBody();

    expect(req.body).toEqual({ name: 'Bob', role: 'admin' });
  });

  it('should parse multipart/form-data as FormData object', async () => {
    const body = new FormData();
    body.append('avatar', 'fakefilecontent');

    const nativeReq = new Request('http://localhost:3000/', {
      method: 'POST',
      body: body,
    });
    const req = new GaoRequest(nativeReq);

    await req.parseBody();
    const formData = req.body as unknown as FormData;

    expect(formData.get('avatar')).toBe('fakefilecontent');
  });

  it('should gracefully handle malformed JSON body', async () => {
    const nativeReq = new Request('http://localhost:3000/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ bad_json',
    });
    const req = new GaoRequest(nativeReq);

    await req.parseBody();

    expect(req.body).toEqual({});
  });
});
