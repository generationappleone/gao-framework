/**
 * @gao/websocket — WebSocketServer
 *
 * Core server that wraps Socket.IO with GAO conventions.
 * Integrates 5 security layers automatically:
 *   1. Ticket-based handshake (TicketStore)
 *   2. Connection rate limiting (WsRateLimiter)
 *   3. Channel authorization (ChannelGuard)
 *   4. Message payload validation (MessageValidator)
 *   5. Periodic re-authentication (ReAuthHandler)
 *
 * Follows SRP: manages Socket.IO server lifecycle.
 * Follows OCP: auth, channels, security are composable.
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Logger } from '@gao/core';
import type { WebSocketConfig, AuthVerifyFn } from './types.js';
import { createAuthMiddleware } from './auth.js';
import { PresenceTracker } from './presence.js';
import { ChannelManager } from './channel.js';
import { TicketStore } from './ticket.js';
import { WsRateLimiter } from './ws-rate-limiter.js';
import { ChannelGuard } from './channel-guard.js';
import { MessageValidator } from './message-validator.js';
import { ReAuthHandler } from './re-auth.js';

export class WebSocketServer {
    private io: SocketIOServer | undefined;
    private readonly presence: PresenceTracker;
    private readonly channels: ChannelManager;

    // ── Security components ──────────────────────────────────
    private readonly ticketStore: TicketStore | undefined;
    private readonly rateLimiter: WsRateLimiter;
    private readonly channelGuard: ChannelGuard;
    private readonly messageValidator: MessageValidator;
    private reAuthHandler: ReAuthHandler | undefined;

    constructor(
        private readonly config: WebSocketConfig,
        private readonly logger: Logger,
    ) {
        this.presence = new PresenceTracker(logger);
        this.channels = new ChannelManager(logger);

        const security = config.security ?? {};

        // Initialize security components
        if (security.ticket?.enabled !== false) {
            this.ticketStore = new TicketStore(security.ticket ?? {});
        }

        this.rateLimiter = new WsRateLimiter(security.rateLimit ?? {});
        this.channelGuard = new ChannelGuard(security.channels ?? {});
        this.messageValidator = new MessageValidator(security.messageValidation ?? {});
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

        // ── Security Layer 1: Rate Limiting (pre-auth) ───────
        this.io.use((socket, next) => {
            const ip = socket.handshake.address;
            const result = this.rateLimiter.allowConnection(ip);

            if (!result.allowed) {
                this.logger.warn('WebSocket rate limit: connection denied', {
                    socketId: socket.id,
                    ip,
                    reason: result.reason,
                });
                next(new Error(result.reason ?? 'Rate limit exceeded'));
                return;
            }

            next();
        });

        // ── Auth middleware (optional) ────────────────────────
        if (authVerifyFn) {
            const security = this.config.security ?? {};
            const authMiddleware = createAuthMiddleware(authVerifyFn, this.logger, {
                allowQueryToken: security.allowQueryToken ?? false,
            });
            this.io.use(authMiddleware as Parameters<SocketIOServer['use']>[0]);

            // ── Security Layer 5: Re-Auth setup ──────────────
            const reAuthConfig = security.reAuth;
            if (reAuthConfig?.enabled !== false) {
                this.reAuthHandler = new ReAuthHandler(authVerifyFn, this.logger, reAuthConfig ?? {});
            }
        }

        // ── Connection handler ────────────────────────────────
        this.io.on('connection', (socket) => {
            const user = socket.data.user as { id?: string } | undefined;
            const userId = user?.id ?? socket.id;
            const ip = socket.handshake.address;

            // ── Security Layer 2: Per-user connection limit ──
            if (user?.id) {
                const userResult = this.rateLimiter.allowUserConnection(user.id);
                if (!userResult.allowed) {
                    this.logger.warn('WebSocket: user connection limit reached', {
                        socketId: socket.id,
                        userId: user.id,
                        reason: userResult.reason,
                    });
                    socket.emit('error', { message: userResult.reason });
                    socket.disconnect(true);
                    return;
                }
                this.rateLimiter.trackConnection(user.id, socket.id);
                this.rateLimiter.resetAuthFailures(ip);
            }

            this.presence.connect(userId, socket.id);

            this.logger.info('WebSocket client connected', {
                socketId: socket.id,
                userId,
            });

            // ── Security Layer 5: Schedule re-auth ───────────
            if (this.reAuthHandler && user?.id) {
                this.reAuthHandler.schedule(
                    socket.id,
                    (event, data) => socket.emit(event, data),
                    () => socket.disconnect(true),
                );

                // Listen for re-auth token response
                socket.on('auth:token', async (data: { token?: string }) => {
                    if (!data?.token || !this.reAuthHandler) return;

                    const renewedUser = await this.reAuthHandler.handleResponse(socket.id, data.token);
                    if (renewedUser) {
                        socket.data.user = renewedUser;
                        socket.emit('auth:renewed', { userId: renewedUser.id });
                    } else {
                        socket.emit('auth:failed', { message: 'Token renewal failed' });
                        socket.disconnect(true);
                    }
                });
            }

            // ── Handle disconnect ────────────────────────────
            socket.on('disconnect', (reason: string) => {
                this.presence.disconnect(socket.id);
                this.channels.leaveAll(socket.id);

                if (user?.id) {
                    this.rateLimiter.removeConnection(user.id, socket.id);
                }

                this.reAuthHandler?.cleanup(socket.id);

                this.logger.info('WebSocket client disconnected', {
                    socketId: socket.id,
                    userId,
                    reason,
                });
            });

            // ── Security Layer 3: Channel join with guard ────
            socket.on('channel:join', (channelName: string) => {
                // Validate channel name
                if (typeof channelName !== 'string' || channelName.length === 0) {
                    socket.emit('channel:error', {
                        channel: channelName,
                        error: 'Invalid channel name',
                    });
                    return;
                }

                // Check authorization
                const socketUser = socket.data.user as { id: string; [key: string]: unknown } | undefined;
                const authResult = this.channelGuard.authorize(channelName, socketUser);

                if (!authResult.allowed) {
                    this.logger.debug('WebSocket channel guard: access denied', {
                        socketId: socket.id,
                        channel: channelName,
                        reason: authResult.reason,
                    });
                    socket.emit('channel:error', {
                        channel: channelName,
                        error: authResult.reason ?? 'Access denied',
                    });
                    return;
                }

                // Use rule's maxMembers if defined, otherwise use channel default
                const maxMembers = authResult.rule?.maxMembers;
                const joined = this.channels.join(channelName, socket.id, {
                    maxMembers,
                    requireAuth: authResult.rule?.requireAuth,
                });

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

            // ── Handle channel leave ─────────────────────────
            socket.on('channel:leave', (channelName: string) => {
                this.channels.leave(channelName, socket.id);
                void socket.leave(channelName);
                socket.emit('channel:left', { channel: channelName });
            });
        });

        this.logger.info('WebSocket server attached', {
            path: this.config.path ?? '/ws',
            corsOrigins: this.config.cors?.origins ?? [],
            security: {
                ticketEnabled: !!this.ticketStore,
                rateLimitEnabled: true,
                channelGuardEnabled: true,
                messageValidationEnabled: true,
                reAuthEnabled: !!this.reAuthHandler,
            },
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
     * Get the ticket store for issuing handshake tickets.
     * Returns undefined if ticket system is disabled.
     *
     * Usage in REST API endpoint:
     * ```ts
     * app.post('/api/ws/ticket', (req) => {
     *   const store = wsServer.getTicketStore();
     *   const result = store.issue({ userId: req.user.id, ip: req.ip });
     *   return { ticket: result.ticket, expiresIn: result.expiresIn };
     * });
     * ```
     */
    getTicketStore(): TicketStore | undefined {
        return this.ticketStore;
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
     * Get the message validator for validating payloads in custom handlers.
     */
    getMessageValidator(): MessageValidator {
        return this.messageValidator;
    }

    /**
     * Get the rate limiter for custom rate limit checks.
     */
    getRateLimiter(): WsRateLimiter {
        return this.rateLimiter;
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
            this.rateLimiter.destroy();
            this.ticketStore?.destroy();
            this.reAuthHandler?.destroy();
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

