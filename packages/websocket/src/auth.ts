/**
 * @gao/websocket — Auth Middleware
 *
 * JWT authentication middleware for Socket.IO connections.
 * Verifies tokens from the handshake auth or query params.
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

/**
 * Create a Socket.IO authentication middleware.
 *
 * Extracts the token from:
 *   1. `socket.handshake.auth.token`
 *   2. `socket.handshake.query.token`
 *
 * Calls the verify function to decode and validate the token.
 */
export function createAuthMiddleware(
    verifyFn: AuthVerifyFn,
    logger: Logger,
) {
    return async (socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> => {
        try {
            // Extract token from auth object or query string
            const token =
                (socket.handshake.auth.token as string | undefined) ??
                (socket.handshake.query.token as string | undefined);

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
