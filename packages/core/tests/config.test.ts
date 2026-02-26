import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineConfig, loadConfig } from '../src/config.js';

describe('Config Loader', () => {
  it('should load default config when no overrides are provided', async () => {
    const config = await loadConfig();
    expect(config.app.name).toBe('GaoApp');
    expect(config.app.port).toBe(3000);
    expect(config.app.environment).toBe('test');
  });

  it('should apply overrides via options', async () => {
    const config = await loadConfig({
      overrides: {
        app: {
          name: 'OverrideApp',
          port: 8080,
        },
      },
      environment: 'test',
    });
    expect(config.app.name).toBe('OverrideApp');
    expect(config.app.port).toBe(8080);
    expect(config.app.environment).toBe('test');
  });

  it('should validate custom schemas', async () => {
    const customSchema = z.object({
      customField: z.string(),
    });

    await expect(
      loadConfig({
        overrides: { app: { name: 'App' } },
        schema: customSchema,
      }),
    ).rejects.toThrow(/Custom config validation failed/);

    const validConfig = await loadConfig({
      overrides: { app: { name: 'App' }, customField: 'hello' },
      schema: customSchema,
    });
    expect(validConfig.customField).toBe('hello');
  });
});
