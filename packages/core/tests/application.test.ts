import { describe, expect, it } from 'vitest';
import { createApp } from '../src/application.js';

describe('GaoApplication', () => {
  it('should bootstrap application correctly', async () => {
    const app = createApp();

    // Core services should be registered automatically
    expect(app.resolve('logger')).toBeDefined();
    expect(app.resolve('router')).toBeDefined();
    expect(app.resolve('events')).toBeDefined();
    expect(app.resolve('cache')).toBeDefined();

    // Avoid running boot() in tests without mocked handlers
    // to prevent unwanted side-effects or hanging, but we can verify it's a GaoApp
    expect(typeof app.boot).toBe('function');
    expect(typeof app.shutdown).toBe('function');
  });
});
