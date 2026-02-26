/**
 * @gao/http — Health Check Endpoint
 *
 * Provides a standard `/health` endpoint for Kubernetes readiness/liveness probes.
 */

import { Controller, Get } from './decorators.js';
import type { GaoRequest } from './request.js';
import type { GaoResponse } from './response.js';

export interface HealthCheckResult {
  status: 'up' | 'down';
  uptime: number;
  timestamp: string;
  checks: {
    db?: 'up' | 'down';
    memory: NodeJS.MemoryUsage;
  };
}

@Controller('/health')
export class HealthController {
  // We can inject dependencies here later (like DB connection)
  // For now, let's keep it abstract or allow passing a custom db check function

  private dbCheckFn?: () => Promise<boolean>;

  constructor(dbCheckFn?: () => Promise<boolean>) {
    this.dbCheckFn = dbCheckFn;
  }

  @Get()
  public async check(_req: GaoRequest, res: GaoResponse): Promise<Response> {
    const result: HealthCheckResult = {
      status: 'up',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        memory: process.memoryUsage(),
      },
    };

    if (this.dbCheckFn) {
      try {
        const dbUp = await this.dbCheckFn();
        result.checks.db = dbUp ? 'up' : 'down';
        if (!dbUp) result.status = 'down';
      } catch (e) {
        result.checks.db = 'down';
        result.status = 'down';
      }
    }

    const statusCode = result.status === 'up' ? 200 : 503;

    return res.status(statusCode).json(result);
  }
}
