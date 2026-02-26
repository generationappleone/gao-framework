import { describe, expect, it } from 'vitest';
import { compression } from '../src/compression.js';
import { MiddlewarePipeline } from '../src/middleware.js';
import { GaoRequest } from '../src/request.js';
import { GaoResponse } from '../src/response.js';

describe('Compression Middleware', () => {
  it('should compress body with brotli if client accepts br and size > threshold', async () => {
    const pipeline = new MiddlewarePipeline();

    pipeline.use(compression({ threshold: 10 })); // low threshold
    pipeline.use(async (req, res, next) => {
      return res.text('This is a sufficiently long string that should be compressed.');
    });

    const nativeReq = new Request('http://localhost/', {
      headers: { 'Accept-Encoding': 'gzip, deflate, br' },
    });
    const req = new GaoRequest(nativeReq);
    const res = new GaoResponse();

    const result = await pipeline.execute(req, res, async () => {});

    expect(result.headers.get('Content-Encoding')).toBe('br');
    expect(result.headers.get('Vary')).toContain('Accept-Encoding');
  });

  it('should compress body with gzip if br is not accepted', async () => {
    const pipeline = new MiddlewarePipeline();

    pipeline.use(compression({ threshold: 10 }));
    pipeline.use(async (req, res, next) => {
      return res.text('This is a sufficiently long string that should be compressed by gzip now.');
    });

    const nativeReq = new Request('http://localhost/', {
      headers: { 'Accept-Encoding': 'gzip, deflate' },
    });
    const req = new GaoRequest(nativeReq);
    const res = new GaoResponse();

    const result = await pipeline.execute(req, res, async () => {});

    expect(result.headers.get('Content-Encoding')).toBe('gzip');
  });

  it('should NOT compress body if size is smaller than threshold', async () => {
    const pipeline = new MiddlewarePipeline();

    pipeline.use(compression({ threshold: 1024 })); // higher threshold
    pipeline.use(async (req, res, next) => {
      return res.text('Too small');
    });

    const nativeReq = new Request('http://localhost/', {
      headers: { 'Accept-Encoding': 'gzip, deflate, br' },
    });
    const req = new GaoRequest(nativeReq);
    const res = new GaoResponse();

    const result = await pipeline.execute(req, res, async () => {});

    expect(result.headers.get('Content-Encoding')).toBeNull(); // no compression applied
  });

  it('should NOT compress body if no acceptable encoding is found', async () => {
    const pipeline = new MiddlewarePipeline();

    pipeline.use(compression({ threshold: 10 }));
    pipeline.use(async (req, res, next) => {
      return res.text('12345678901234567890');
    });

    const nativeReq = new Request('http://localhost/', {
      headers: { 'Accept-Encoding': 'alien-zip' },
    });
    const req = new GaoRequest(nativeReq);
    const res = new GaoResponse();

    const result = await pipeline.execute(req, res, async () => {});

    expect(result.headers.get('Content-Encoding')).toBeNull(); // fallback
  });
});
