/**
 * @gao/websocket — GAO Plugin
 */

import type { Plugin, GaoApp, Logger } from '@gao/core';
import type { WebSocketConfig } from './types.js';
import { WebSocketServer } from './server.js';

const PLUGIN_NAME = '@gao/websocket';

export function websocketPlugin(): Plugin {
    let wsServer: WebSocketServer | undefined;

    return {
        name: PLUGIN_NAME,
        version: '0.1.0',

        onRegister(_app: GaoApp): void {
            // Config not loaded yet — noop
        },

        async onBoot(app: GaoApp): Promise<void> {
            const config = (app.config as Record<string, unknown>).websocket as
                | WebSocketConfig
                | undefined;

            const logger = app.resolve<Logger>('logger');

            if (!config?.enabled) {
                logger.info(`[${PLUGIN_NAME}] WebSocket is disabled — skipping boot.`);
                return;
            }

            // Create WebSocket server (attach is deferred until HTTP server is ready)
            wsServer = new WebSocketServer(config, logger);

            // Register in DI container
            const container = (
                app as unknown as {
                    container: { instance: (token: string, value: unknown) => void };
                }
            ).container;
            container.instance('websocket', wsServer);

            logger.info(`[${PLUGIN_NAME}] WebSocket server created.`, {
                path: config.path ?? '/ws',
            });
        },

        async onShutdown(_app: GaoApp): Promise<void> {
            if (wsServer) {
                await wsServer.shutdown();
            }
        },
    };
}
