import { describe, expect, it, vi } from 'vitest';
import { MiddlewarePipeline } from '../src/middleware.js';
import { GaoRequest } from '../src/request.js';
import { GaoResponse } from '../src/response.js';

describe('MiddlewarePipeline', () => {
  it('should execute middleware in onion order', async () => {
    const pipeline = new MiddlewarePipeline();
    const trace: string[] = [];

    pipeline.use(async (req, res, next) => {
      trace.push('M1-Before');
      await next();
      trace.push('M1-After');
    });

    pipeline.use(async (req, res, next) => {
      trace.push('M2-Before');
      await next();
      trace.push('M2-After');
    });

    const req = new GaoRequest(new Request('http://localhost/'));
    const res = new GaoResponse();

    await pipeline.execute(req, res, async () => {
      trace.push('Handler');
    });

    expect(trace).toEqual(['M1-Before', 'M2-Before', 'Handler', 'M2-After', 'M1-After']);
  });

  it('should allow middleware to short-circuit the execution', async () => {
    const pipeline = new MiddlewarePipeline();
    const trace: string[] = [];

    pipeline.use(async (req, res, next) => {
      trace.push('M1');
      return next();
    });

    pipeline.use(async (req, res, next) => {
      trace.push('M2 (Short Circuit)');
      return res.status(401).json({ error: 'unauthorized' });
    });

    pipeline.use(async (req, res, next) => {
      trace.push('M3');
      return next();
    });

    const req = new GaoRequest(new Request('http://localhost/'));
    const res = new GaoResponse();

    const result = await pipeline.execute(req, res, async () => {
      trace.push('Handler');
    });

    expect(trace).toEqual(['M1', 'M2 (Short Circuit)']);
    expect(result.status).toBe(401);
  });

  it('should throw an error if next() is called multiple times', async () => {
    const pipeline = new MiddlewarePipeline();

    pipeline.use(async (req, res, next) => {
      await next();
      await next(); // multiple calls
    });

    const req = new GaoRequest(new Request('http://localhost/'));
    const res = new GaoResponse();

    await expect(pipeline.execute(req, res, async () => {})).rejects.toThrow(
      /next\(\) called multiple times/,
    );
  });

  it('should correctly propagate errors to the caller', async () => {
    const pipeline = new MiddlewarePipeline();

    pipeline.use(async (req, res, next) => {
      await next();
    });

    pipeline.use(async (req, res, next) => {
      throw new Error('Pipeline error');
    });

    const req = new GaoRequest(new Request('http://localhost/'));
    const res = new GaoResponse();

    await expect(pipeline.execute(req, res, async () => {})).rejects.toThrow('Pipeline error');
  });
});
