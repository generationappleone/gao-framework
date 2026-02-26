/**
 * @gao/core — Plugin System
 *
 * Plugin lifecycle:
 * 1. onRegister() — called when plugin is registered (sync setup)
 * 2. onBoot() — called during app boot (async initialization)
 * 3. onShutdown() — called during graceful shutdown (cleanup)
 */

import { InternalError } from './errors.js';
import type { Logger } from './logger.js';
import type { GaoApp, Plugin } from './types.js';

export class PluginManager {
  private readonly plugins: Plugin[] = [];
  private readonly registered = new Set<string>();
  private booted = false;

  constructor(private readonly logger: Logger) {}

  /**
   * Register a plugin. Calls onRegister() synchronously.
   * @throws InternalError if plugin is already registered or if called after boot
   */
  register(plugin: Plugin, app: GaoApp): void {
    if (this.booted) {
      throw new InternalError(
        `Cannot register plugin "${plugin.name}" after boot. Register all plugins before calling app.boot().`,
      );
    }

    if (this.registered.has(plugin.name)) {
      this.logger.warn(`Plugin "${plugin.name}" is already registered — skipping.`);
      return;
    }

    this.logger.debug(`Registering plugin: ${plugin.name}`, {
      version: plugin.version,
    });

    this.registered.add(plugin.name);
    this.plugins.push(plugin);

    // Synchronous registration hook
    if (plugin.onRegister) {
      plugin.onRegister(app);
    }
  }

  /**
   * Boot all registered plugins. Calls onBoot() in registration order.
   */
  async boot(app: GaoApp): Promise<void> {
    if (this.booted) {
      this.logger.warn('Plugins already booted — skipping.');
      return;
    }

    this.logger.info(`Booting ${this.plugins.length} plugins...`);

    for (const plugin of this.plugins) {
      if (plugin.onBoot) {
        this.logger.debug(`Booting plugin: ${plugin.name}`);
        await plugin.onBoot(app);
      }
    }

    this.booted = true;
    this.logger.info('All plugins booted successfully.');
  }

  /**
   * Shutdown all plugins in reverse order. Calls onShutdown().
   */
  async shutdown(app: GaoApp): Promise<void> {
    this.logger.info('Shutting down plugins...');

    // Shutdown in reverse registration order (LIFO)
    const reversed = [...this.plugins].reverse();

    for (const plugin of reversed) {
      if (plugin.onShutdown) {
        try {
          this.logger.debug(`Shutting down plugin: ${plugin.name}`);
          await plugin.onShutdown(app);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Error shutting down plugin "${plugin.name}": ${message}`);
        }
      }
    }

    this.booted = false;
    this.logger.info('All plugins shut down.');
  }

  /**
   * Check if a plugin is registered.
   */
  has(name: string): boolean {
    return this.registered.has(name);
  }

  /**
   * Get count of registered plugins.
   */
  get count(): number {
    return this.plugins.length;
  }
}

export function createPluginManager(logger: Logger): PluginManager {
  return new PluginManager(logger);
}
