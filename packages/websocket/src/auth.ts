/**
 * @gao/websocket — Auth Middleware
 *
 * JWT authentication middleware for Socket.IO connections.
 * Verifies tokens from the handshake auth object.
 *
 * Security: Query string tokens are BLOCKED by default because
 * they leak in server access logs, browser history, and proxy logs.
 * Use the `allowQueryToken` option only for backward compatibility.
 *
 * Follows SRP: only handles token extraction and verification.
 */

import type { Logger } from '@gao/core';
import type { AuthVerifyFn, SocketUser } from './types.js';

/**
 * Augment Socket type with user data.
 */
export interface AuthenticatedSocket {
    readonly id: string;
    data: { user?: SocketUser };
    readonly handshake: {
        readonly auth: Record<string, unknown>;
        readonly query: Record<string, string | string[] | undefined>;
    };
    disconnect(close?: boolean): void;
}

export interface AuthMiddlewareOptions {
    /**
     * Allow tokens in query string (`?token=xxx`).
     *
     * ⚠️ INSECURE — tokens in URLs are logged by web servers,
     * proxies, and stored in browser history. Disabled by default.
     *
     * Use `ticket` system instead for secure handshake.
     */
    readonly allowQueryToken?: boolean;
}

/**
 * Create a Socket.IO authentication middleware.
 *
 * Extracts the token from `socket.handshake.auth.token` (preferred).
 * Query string tokens are blocked by default for security.
 *
 * Calls the verify function to decode and validate the token.
 */
export function createAuthMiddleware(
    verifyFn: AuthVerifyFn,
    logger: Logger,
    options: AuthMiddlewareOptions = {},
) {
    const allowQueryToken = options.allowQueryToken ?? false;

    return async (socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> => {
        try {
            // Extract token from auth object (secure — sent in WS frame, not URL)
            const authToken = socket.handshake.auth.token as string | undefined;

            // Extract token from query string (insecure — leaks in logs)
            const queryToken = socket.handshake.query.token as string | undefined;

            // Warn if query token is present but blocked
            if (queryToken && !allowQueryToken) {
                logger.warn('WebSocket auth: query token rejected (insecure — use auth object or ticket system)', {
                    socketId: socket.id,
                });
            }

            // Secure default: only use auth token unless query is explicitly allowed
            const token = authToken ?? (allowQueryToken ? queryToken : undefined);

            if (!token) {
                logger.debug('WebSocket auth: no token provided', { socketId: socket.id });
                next(new Error('Authentication required'));
                return;
            }

            // Verify token
            const user = await verifyFn(token);

            if (!user) {
                logger.debug('WebSocket auth: invalid token', { socketId: socket.id });
                next(new Error('Invalid or expired token'));
                return;
            }

            // Attach user data to socket
            socket.data.user = user;
            logger.debug('WebSocket auth: authenticated', {
                socketId: socket.id,
                userId: user.id,
            });

            next();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error('WebSocket auth error', {
                socketId: socket.id,
                error: message,
            });
            next(new Error('Authentication failed'));
        }
    };
}
