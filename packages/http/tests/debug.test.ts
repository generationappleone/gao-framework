import { describe, expect, it } from 'vitest';
import { renderDevErrorPage } from '../src/debug/error-page.js';
import { debugToolbar } from '../src/debug/toolbar.js';
import { MiddlewarePipeline } from '../src/middleware.js';
import { GaoRequest } from '../src/request.js';
import { GaoResponse } from '../src/response.js';

describe('Debug Toolbar', () => {
  it('should inject html if enabled', async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use(debugToolbar({ enabled: true }));
    pipeline.use(async (req, res, next) => {
      return res.status(200).html('<html><body><h1>Test</h1></body></html>');
    });

    const req = new GaoRequest(new Request('http://localhost/view'));
    const res = new GaoResponse();

    const result = await pipeline.execute(req, res, async () => {});
    const html = await result.text();

    expect(html).toContain('GAO Dev');
    expect(html).toContain('Time:');
    expect(result.headers.get('Server-Timing')).toBeDefined();
  });

  it('should not inject html if disabled', async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use(debugToolbar({ enabled: false }));
    pipeline.use(async (req, res, next) => {
      return res.status(200).html('<html><body><h1>Test</h1></body></html>');
    });

    const req = new GaoRequest(new Request('http://localhost/view'));
    const res = new GaoResponse();

    const result = await pipeline.execute(req, res, async () => {});
    const html = await result.text();

    expect(html).not.toContain('GAO Dev');
    expect(result.headers.get('Server-Timing')).toBeNull();
  });

  it('should only add timing headers for JSON if enabled', async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.use(debugToolbar({ enabled: true }));
    pipeline.use(async (req, res, next) => {
      return res.status(200).json({ ok: true });
    });

    const req = new GaoRequest(new Request('http://localhost/api'));
    const res = new GaoResponse();

    const result = await pipeline.execute(req, res, async () => {});
    const body = await result.text();

    expect(body).not.toContain('GAO Dev'); // NO HTML injected in JSON!
    expect(result.headers.get('Server-Timing')).toBeDefined();
  });
});

describe('Dev Error Page', () => {
  it('should render an HTML error template', () => {
    const err = new Error('Database disconnected');
    const html = renderDevErrorPage(err, '/test-route');

    expect(html).toContain('Database disconnected');
    expect(html).toContain('/test-route');
    expect(html).toContain('<!DOCTYPE html>');
  });
});
