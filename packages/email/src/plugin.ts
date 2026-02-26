/**
 * @gao/email — GAO Plugin
 *
 * Integrates the email package into the GAO application lifecycle.
 */

import type { Plugin, GaoApp, Logger } from '@gao/core';
import type { EmailConfig } from './types.js';
import { Mailer } from './mailer.js';

const PLUGIN_NAME = '@gao/email';

export function emailPlugin(): Plugin {
    let mailer: Mailer | undefined;

    return {
        name: PLUGIN_NAME,
        version: '0.1.0',

        onRegister(_app: GaoApp): void {
            // Config not loaded yet — noop
        },

        async onBoot(app: GaoApp): Promise<void> {
            const config = (app.config as Record<string, unknown>).email as
                | EmailConfig
                | undefined;

            const logger = app.resolve<Logger>('logger');

            if (!config) {
                logger.info(`[${PLUGIN_NAME}] Email not configured — skipping boot.`);
                return;
            }

            // Create mailer
            mailer = new Mailer(config, logger);
            await mailer.initialize();

            // Register in DI container
            const container = (
                app as unknown as {
                    container: { instance: (token: string, value: unknown) => void };
                }
            ).container;
            container.instance('mailer', mailer);

            // Queue integration: if queue is available and config.queue is true
            if (config.queue) {
                try {
                    const queueManager = app.resolve<{
                        addJob: <T>(
                            queueName: string,
                            jobName: string,
                            data: T,
                        ) => Promise<string>;
                    }>('queue');

                    mailer.setQueueFunction(async (options) => {
                        return queueManager.addJob('email', 'send', options);
                    });

                    logger.info(`[${PLUGIN_NAME}] Queue integration enabled.`);
                } catch {
                    logger.warn(
                        `[${PLUGIN_NAME}] Queue integration requested but @gao/queue not available. Emails will be sent directly.`,
                    );
                }
            }

            logger.info(`[${PLUGIN_NAME}] Email system booted.`, {
                transport: config.transport,
                from: config.from.address,
            });
        },

        async onShutdown(_app: GaoApp): Promise<void> {
            if (mailer) {
                mailer.shutdown();
            }
        },
    };
}
