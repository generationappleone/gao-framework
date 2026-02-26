import { describe, expect, it, vi } from 'vitest';
import { createLogger } from '../src/logger.js';
import { createPluginManager } from '../src/plugin.js';
import type { GaoApp, Plugin } from '../src/types.js';

describe('Plugin System', () => {
  it('should register and boot plugins', async () => {
    const logger = createLogger();
    const manager = createPluginManager(logger);

    const plugin: Plugin = {
      name: 'test-plugin',
      onRegister: vi.fn(),
      onBoot: vi.fn(),
      onShutdown: vi.fn(),
    };

    const mockApp = {} as GaoApp;

    manager.register(plugin, mockApp);
    expect(plugin.onRegister).toHaveBeenCalledWith(mockApp);

    await manager.boot(mockApp);
    expect(plugin.onBoot).toHaveBeenCalledWith(mockApp);

    await manager.shutdown(mockApp);
    expect(plugin.onShutdown).toHaveBeenCalledWith(mockApp);
  });
});
