/**
 * @gao/core — GaoApplication
 *
 * Bootstrap class that wires together all core components:
 * - Plugin registration and lifecycle
 * - DI container setup
 * - Graceful shutdown handling
 * - Uncaught exception / unhandled rejection handlers
 */

import { CacheService, MemoryCacheAdapter } from './cache.js';
import { type ConfigLoaderOptions, loadConfig } from './config.js';
import { Container } from './container.js';
import { EventEmitter } from './events.js';
import { type Logger, createLogger } from './logger.js';
import { PluginManager } from './plugin.js';
import { Router } from './router.js';
import type { GaoApp, GaoConfig, Plugin } from './types.js';

export class GaoApplication implements GaoApp {
  public config!: GaoConfig;
  public readonly container: Container;
  public readonly router: Router;
  public readonly events: EventEmitter;
  public readonly cache: CacheService;
  public logger: Logger;

  private readonly pluginManager: PluginManager;
  private booted = false;
  private shuttingDown = false;

  constructor() {
    this.container = new Container();
    this.router = new Router();
    this.events = new EventEmitter();
    this.logger = createLogger({ level: 'info' });
    this.pluginManager = new PluginManager(this.logger);
    this.cache = new CacheService(new MemoryCacheAdapter());

    // Register core services in DI container
    this.container.instance('logger', this.logger);
    this.container.instance('router', this.router);
    this.container.instance('events', this.events);
    this.container.instance('cache', this.cache);
  }

  /**
   * Register a plugin.
   */
  register(plugin: Plugin): void {
    this.pluginManager.register(plugin, this);
  }

  /**
   * Resolve a service from the DI container.
   */
  resolve<T>(token: symbol | string): T {
    return this.container.resolve<T>(token);
  }

  /**
   * Boot the application:
   * 1. Load config
   * 2. Re-configure logger
   * 3. Boot plugins
   * 4. Setup shutdown handlers
   */
  async boot(configOptions?: ConfigLoaderOptions): Promise<void> {
    if (this.booted) {
      this.logger.warn('Application already booted.');
      return;
    }

    // 1. Load config
    this.config = await loadConfig(configOptions);
    this.container.instance('config', this.config);

    // 2. Re-configure logger with loaded config
    this.logger = createLogger({
      level: this.config.app.debug ? 'debug' : 'info',
      name: this.config.app.name,
      pretty: this.config.app.environment === 'development',
    });
    this.container.instance('logger', this.logger);

    this.logger.info(`Booting ${this.config.app.name}...`, {
      environment: this.config.app.environment,
      port: this.config.app.port,
    });

    // 3. Boot plugins
    await this.pluginManager.boot(this);

    // 4. Setup shutdown handlers
    this.setupShutdownHandlers();

    this.booted = true;

    await this.events.emit('app:booted', { app: this });
    this.logger.info(`${this.config.app.name} booted successfully.`);
  }

  /**
   * Gracefully shut down the application.
   */
  async shutdown(): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    this.logger.info('Shutting down application...');

    await this.events.emit('app:shutdown', { app: this });
    await this.pluginManager.shutdown(this);

    this.logger.info('Application shut down complete.');
  }

  /**
   * Setup handlers for process signals and unhandled errors.
   */
  private setupShutdownHandlers(): void {
    // Graceful shutdown on SIGTERM/SIGINT
    const shutdownHandler = async () => {
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', shutdownHandler);
    process.on('SIGINT', shutdownHandler);

    // Unhandled errors — log and continue (don't crash)
    process.on('uncaughtException', (error: Error) => {
      this.logger.fatal('Uncaught exception — application may be in an unstable state', {
        error: error.message,
        stack: error.stack,
      });
    });

    process.on('unhandledRejection', (reason: unknown) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      this.logger.error('Unhandled promise rejection', {
        reason: message,
        stack,
      });
    });
  }
}

/**
 * Create a new GaoApplication instance.
 */
export function createApp(): GaoApplication {
  return new GaoApplication();
}
