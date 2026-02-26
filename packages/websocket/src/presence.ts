/**
 * @gao/websocket — PresenceTracker
 *
 * Tracks online/offline status of connected users.
 * Follows SRP: only manages presence state.
 */

import type { Logger } from '@gao/core';
import type { PresenceInfo } from './types.js';

export class PresenceTracker {
    /** Map of userId -> Set of socketIds (one user may have multiple connections) */
    private readonly connections = new Map<string, Set<string>>();
    /** Map of socketId -> PresenceInfo */
    private readonly sockets = new Map<string, PresenceInfo>();

    constructor(private readonly logger: Logger) { }

    /**
     * Register a new connection.
     */
    connect(userId: string, socketId: string, metadata?: Record<string, unknown>): void {
        // Track socket
        this.sockets.set(socketId, {
            userId,
            socketId,
            connectedAt: Date.now(),
            metadata,
        });

        // Track user's socket set
        const userSockets = this.connections.get(userId);
        if (userSockets) {
            userSockets.add(socketId);
        } else {
            this.connections.set(userId, new Set([socketId]));
        }

        this.logger.debug('Presence: user connected', {
            userId,
            socketId,
            totalConnections: this.connections.get(userId)?.size ?? 0,
        });
    }

    /**
     * Remove a connection.
     */
    disconnect(socketId: string): PresenceInfo | undefined {
        const info = this.sockets.get(socketId);
        if (!info) return undefined;

        this.sockets.delete(socketId);

        const userSockets = this.connections.get(info.userId);
        if (userSockets) {
            userSockets.delete(socketId);
            if (userSockets.size === 0) {
                this.connections.delete(info.userId);
                this.logger.debug('Presence: user fully disconnected', {
                    userId: info.userId,
                });
            }
        }

        return info;
    }

    /**
     * Check if a user is online (has at least one active connection).
     */
    isOnline(userId: string): boolean {
        const sockets = this.connections.get(userId);
        return sockets !== undefined && sockets.size > 0;
    }

    /**
     * Get all socket IDs for a user.
     */
    getUserSockets(userId: string): string[] {
        const sockets = this.connections.get(userId);
        return sockets ? [...sockets] : [];
    }

    /**
     * Get all online user IDs.
     */
    getOnlineUsers(): string[] {
        return [...this.connections.keys()];
    }

    /**
     * Get the total number of online users.
     */
    get onlineCount(): number {
        return this.connections.size;
    }

    /**
     * Get presence info for a specific socket.
     */
    getSocketInfo(socketId: string): PresenceInfo | undefined {
        return this.sockets.get(socketId);
    }

    /**
     * Clear all presence data (useful for testing or server restart).
     */
    clear(): void {
        this.connections.clear();
        this.sockets.clear();
    }
}

export function createPresenceTracker(logger: Logger): PresenceTracker {
    return new PresenceTracker(logger);
}
