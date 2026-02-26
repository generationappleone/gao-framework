/**
 * @gao/websocket — WebSocketServer
 *
 * Core server that wraps Socket.IO with GAO conventions.
 * Follows SRP: manages Socket.IO server lifecycle.
 * Follows OCP: auth, channels, and presence are composable.
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Logger } from '@gao/core';
import type { WebSocketConfig, AuthVerifyFn } from './types.js';
import { createAuthMiddleware } from './auth.js';
import { PresenceTracker } from './presence.js';
import { ChannelManager } from './channel.js';

export class WebSocketServer {
    private io: SocketIOServer | undefined;
    private readonly presence: PresenceTracker;
    private readonly channels: ChannelManager;

    constructor(
        private readonly config: WebSocketConfig,
        private readonly logger: Logger,
    ) {
        this.presence = new PresenceTracker(logger);
        this.channels = new ChannelManager(logger);
    }

    /**
     * Attach the WebSocket server to an existing HTTP server.
     */
    attach(
        httpServer: unknown,
        authVerifyFn?: AuthVerifyFn,
    ): SocketIOServer {
        // Socket.IO accepts http.Server, https.Server, Http2SecureServer, etc.
        // Using 'as any' is the standard approach since the union type is very broad.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.io = new SocketIOServer(httpServer as any, {
            path: this.config.path ?? '/ws',
            cors: {
                origin: this.config.cors?.origins ?? [],
                credentials: this.config.cors?.credentials ?? true,
            },
            pingInterval: this.config.pingInterval ?? 25000,
            pingTimeout: this.config.pingTimeout ?? 20000,
            maxHttpBufferSize: this.config.maxBufferSize ?? 1_048_576,
        });

        // Auth middleware (optional — only if authVerifyFn is provided)
        if (authVerifyFn) {
            const authMiddleware = createAuthMiddleware(authVerifyFn, this.logger);
            this.io.use(authMiddleware as Parameters<SocketIOServer['use']>[0]);
        }

        // Connection handler
        this.io.on('connection', (socket) => {
            const userId = (socket.data.user?.id as string | undefined) ?? socket.id;

            this.presence.connect(userId, socket.id);

            this.logger.info('WebSocket client connected', {
                socketId: socket.id,
                userId,
            });

            // Handle disconnect
            socket.on('disconnect', (reason: string) => {
                this.presence.disconnect(socket.id);
                this.channels.leaveAll(socket.id);

                this.logger.info('WebSocket client disconnected', {
                    socketId: socket.id,
                    userId,
                    reason,
                });
            });

            // Handle channel join
            socket.on('channel:join', (channelName: string) => {
                const joined = this.channels.join(channelName, socket.id);
                if (joined) {
                    void socket.join(channelName);
                    socket.emit('channel:joined', { channel: channelName });
                } else {
                    socket.emit('channel:error', {
                        channel: channelName,
                        error: 'Channel is full',
                    });
                }
            });

            // Handle channel leave
            socket.on('channel:leave', (channelName: string) => {
                this.channels.leave(channelName, socket.id);
                void socket.leave(channelName);
                socket.emit('channel:left', { channel: channelName });
            });
        });

        this.logger.info('WebSocket server attached', {
            path: this.config.path ?? '/ws',
            corsOrigins: this.config.cors?.origins ?? [],
        });

        return this.io;
    }

    /**
     * Get the underlying Socket.IO server instance.
     */
    getIO(): SocketIOServer {
        if (!this.io) throw new Error('WebSocket server not initialized. Call attach() first.');
        return this.io;
    }

    /**
     * Get the presence tracker.
     */
    getPresence(): PresenceTracker {
        return this.presence;
    }

    /**
     * Get the channel manager.
     */
    getChannels(): ChannelManager {
        return this.channels;
    }

    /**
     * Emit an event to a specific user (across all their connections).
     */
    emitToUser(userId: string, event: string, data: unknown): void {
        const sockets = this.presence.getUserSockets(userId);
        if (sockets.length === 0) return;

        const io = this.getIO();
        for (const socketId of sockets) {
            io.to(socketId).emit(event, data);
        }
    }

    /**
     * Emit an event to all members of a channel.
     */
    emitToChannel(channel: string, event: string, data: unknown): void {
        this.getIO().to(channel).emit(event, data);
    }

    /**
     * Broadcast an event to all connected clients.
     */
    broadcast(event: string, data: unknown): void {
        this.getIO().emit(event, data);
    }

    /**
     * Gracefully shut down the WebSocket server.
     */
    async shutdown(): Promise<void> {
        if (this.io) {
            this.io.disconnectSockets(true);
            await new Promise<void>((resolve) => {
                this.io!.close(() => {
                    resolve();
                });
            });
            this.presence.clear();
            this.channels.clear();
            this.logger.info('WebSocket server shut down.');
        }
    }
}

/**
 * Factory function.
 */
export function createWebSocketServer(
    config: WebSocketConfig,
    logger: Logger,
): WebSocketServer {
    return new WebSocketServer(config, logger);
}
