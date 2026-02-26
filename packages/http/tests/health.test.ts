import { describe, expect, it } from 'vitest';
import { HealthController } from '../src/health.js';
import { GaoRequest } from '../src/request.js';
import { GaoResponse } from '../src/response.js';

describe('HealthController', () => {
  it('should return UP status with memory info', async () => {
    const controller = new HealthController();
    const req = new GaoRequest(new Request('http://localhost/health'));
    const res = new GaoResponse();

    const response = await controller.check(req, res);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.status).toBe('up');
    expect(body.data.uptime).toBeGreaterThan(0);
    expect(body.data.checks.memory).toBeDefined();
  });

  it('should return UP status if db check passes', async () => {
    const dbCheck = async () => true;
    const controller = new HealthController(dbCheck);
    const req = new GaoRequest(new Request('http://localhost/health'));
    const res = new GaoResponse();

    const response = await controller.check(req, res);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.status).toBe('up');
    expect(body.data.checks.db).toBe('up');
  });

  it('should return DOWN status if db check fails', async () => {
    const dbCheck = async () => false;
    const controller = new HealthController(dbCheck);
    const req = new GaoRequest(new Request('http://localhost/health'));
    const res = new GaoResponse();

    const response = await controller.check(req, res);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.data.status).toBe('down');
    expect(body.data.checks.db).toBe('down');
  });

  it('should return DOWN status if db check throws error', async () => {
    const dbCheck = async () => {
      throw new Error('DB Error');
    };
    const controller = new HealthController(dbCheck);
    const req = new GaoRequest(new Request('http://localhost/health'));
    const res = new GaoResponse();

    const response = await controller.check(req, res);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.data.status).toBe('down');
    expect(body.data.checks.db).toBe('down');
  });
});
