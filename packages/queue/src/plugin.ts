/**
 * @gao/queue — GAO Plugin
 *
 * Integrates the queue package into the GAO application lifecycle:
 * - onRegister: noop (config not yet loaded)
 * - onBoot: create QueueManager & Scheduler, register in DI container
 * - onShutdown: gracefully close all queues
 */

import type { Plugin, GaoApp, Logger } from '@gao/core';
import type { QueueConfig } from './types.js';
import { QueueManager } from './queue-manager.js';
import { Scheduler } from './scheduler.js';

const PLUGIN_NAME = '@gao/queue';

export function queuePlugin(): Plugin {
    let queueManager: QueueManager | undefined;

    return {
        name: PLUGIN_NAME,
        version: '0.1.0',

        onRegister(_app: GaoApp): void {
            // Config is not loaded yet during registration — noop
        },

        async onBoot(app: GaoApp): Promise<void> {
            const config = (app.config as Record<string, unknown>).queue as
                | QueueConfig
                | undefined;

            const logger = app.resolve<Logger>('logger');

            if (!config?.enabled) {
                logger.info(`[${PLUGIN_NAME}] Queue is disabled — skipping boot.`);
                return;
            }

            // Create QueueManager
            queueManager = new QueueManager(config, logger);

            // Create Scheduler
            const scheduler = new Scheduler(queueManager, logger);

            // Register in DI container
            const container = (
                app as unknown as {
                    container: { instance: (token: string, value: unknown) => void };
                }
            ).container;
            container.instance('queue', queueManager);
            container.instance('scheduler', scheduler);

            logger.info(`[${PLUGIN_NAME}] Queue system booted`, {
                redis: `${config.redis.host}:${config.redis.port}`,
            });
        },

        async onShutdown(_app: GaoApp): Promise<void> {
            if (queueManager) {
                await queueManager.shutdown();
            }
        },
    };
}
