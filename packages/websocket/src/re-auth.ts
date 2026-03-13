/**
 * @gao/websocket — Re-Authentication Handler
 *
 * Manages periodic re-authentication for long-lived WebSocket connections.
 * Without this, a JWT could expire but the WebSocket connection remains
 * active indefinitely.
 *
 * Flow:
 *   1. After connection, schedule a re-auth check at intervalMs.
 *   2. When due, emit 'auth:renew' to the client.
 *   3. Client must respond with 'auth:token' containing a fresh JWT.
 *   4. If no valid token within gracePeriodMs → disconnect.
 *
 * Timer lifecycle:
 *   - Interval timer: fires periodically to initiate re-auth.
 *   - Grace timer: fires once after requesting re-auth, disconnects if no response.
 *   - Both are cleaned up on disconnect or destroy.
 */

import type { Logger } from '@gao/core';
import type { WsReAuthConfig, AuthVerifyFn, SocketUser } from './types.js';

// ─── Internal State Per Socket ────────────────────────────────

interface SocketTimers {
    /** Periodic interval that triggers re-auth requests. */
    interval: ReturnType<typeof setInterval>;
    /** Grace period timer (set during re-auth, cleared on response). */
    graceTimer?: ReturnType<typeof setTimeout>;
}

// ─── ReAuthHandler ────────────────────────────────────────────

export class ReAuthHandler {
    private readonly intervalMs: number;
    private readonly gracePeriodMs: number;

    /** Map<socketId, timers> — active timers for each socket. */
    private readonly socketTimers = new Map<string, SocketTimers>();

    constructor(
        private readonly verifyFn: AuthVerifyFn,
        private readonly logger: Logger,
        config: WsReAuthConfig = {},
    ) {
        this.intervalMs = (config.intervalMinutes ?? 30) * 60_000;
        this.gracePeriodMs = (config.gracePeriodSeconds ?? 30) * 1000;
    }

    /**
     * Start periodic re-authentication for a connected socket.
     * Call this after the socket is successfully authenticated.
     *
     * @param socketId - The socket ID.
     * @param emitFn - Function to emit events to the socket.
     * @param disconnectFn - Function to disconnect the socket.
     */
    schedule(
        socketId: string,
        emitFn: (event: string, data?: unknown) => void,
        disconnectFn: () => void,
    ): void {
        // Clean up any existing timers for this socket
        this.cleanup(socketId);

        const interval = setInterval(() => {
            this.logger.debug('Re-auth: requesting token renewal', { socketId });

            // Emit re-auth request to client
            emitFn('auth:renew', {
                deadline: this.gracePeriodMs,
                message: 'Please provide a fresh authentication token.',
            });

            // Set grace period — disconnect if no response
            const graceTimer = setTimeout(() => {
                this.logger.warn('Re-auth: grace period expired — disconnecting', { socketId });
                disconnectFn();
            }, this.gracePeriodMs);

            // Store grace timer for cleanup
            const timers = this.socketTimers.get(socketId);
            if (timers) {
                timers.graceTimer = graceTimer;
            }
        }, this.intervalMs);

        // Prevent timer from keeping the process alive
        if (interval.unref) interval.unref();

        this.socketTimers.set(socketId, { interval });
    }

    /**
     * Handle a re-auth response from the client.
     * Verifies the new token and cancels the grace period timer.
     *
     * @returns The verified user, or null if verification failed.
     */
    async handleResponse(socketId: string, token: string): Promise<SocketUser | null> {
        const timers = this.socketTimers.get(socketId);

        // Cancel grace period timer (client responded in time)
        if (timers?.graceTimer) {
            clearTimeout(timers.graceTimer);
            timers.graceTimer = undefined;
        }

        try {
            const user = await this.verifyFn(token);

            if (!user) {
                this.logger.warn('Re-auth: invalid token provided', { socketId });
                return null;
            }

            this.logger.debug('Re-auth: token renewed successfully', {
                socketId,
                userId: user.id,
            });

            return user;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn('Re-auth: token verification error', { socketId, error: message });
            return null;
        }
    }

    /**
     * Clean up all timers for a specific socket.
     * Call this on socket disconnect.
     */
    cleanup(socketId: string): void {
        const timers = this.socketTimers.get(socketId);
        if (!timers) return;

        clearInterval(timers.interval);
        if (timers.graceTimer) {
            clearTimeout(timers.graceTimer);
        }

        this.socketTimers.delete(socketId);
    }

    /**
     * Check if a socket has an active re-auth schedule.
     */
    isScheduled(socketId: string): boolean {
        return this.socketTimers.has(socketId);
    }

    /** Number of sockets with active re-auth schedules. */
    get activeCount(): number {
        return this.socketTimers.size;
    }

    /** Stop all timers and release all resources. */
    destroy(): void {
        for (const [, timers] of this.socketTimers) {
            clearInterval(timers.interval);
            if (timers.graceTimer) {
                clearTimeout(timers.graceTimer);
            }
        }
        this.socketTimers.clear();
    }
}
