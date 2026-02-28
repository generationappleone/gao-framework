/**
 * @gao/crypto-transport — Session Store
 *
 * In-memory implementation of the SessionStore interface.
 * Suitable for development and single-process deployments.
 *
 * For production multi-process deployments, use RedisSessionStore
 * (see redis-session-store.ts).
 */

import type { E2EESession, SessionStore } from '../types.js';

/**
 * In-memory session store with automatic TTL-based expiration.
 *
 * Sessions are stored in a Map keyed by sessionId.
 * A periodic cleanup runs every `cleanupIntervalMs` to evict expired sessions.
 */
export class MemorySessionStore implements SessionStore {
    private readonly sessions = new Map<string, E2EESession>();
    private readonly ttlMs: number;
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;

    constructor(options?: { ttlMs?: number; cleanupIntervalMs?: number }) {
        this.ttlMs = options?.ttlMs ?? 86_400_000; // Default: 24 hours
        const cleanupInterval = options?.cleanupIntervalMs ?? 300_000; // Default: 5 minutes

        this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
        // Allow the timer to not keep the process alive
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    async get(sessionId: string): Promise<E2EESession | null> {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // Check TTL
        if (Date.now() - session.createdAt > this.ttlMs) {
            this.sessions.delete(sessionId);
            return null;
        }

        return session;
    }

    async set(session: E2EESession): Promise<void> {
        this.sessions.set(session.sessionId, session);
    }

    async delete(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
    }

    async incrementRequestCount(sessionId: string): Promise<number> {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');
        session.requestCount++;
        return session.requestCount;
    }

    /** Evict all expired sessions */
    private cleanup(): void {
        const now = Date.now();
        for (const [id, session] of this.sessions) {
            if (now - session.createdAt > this.ttlMs) {
                this.sessions.delete(id);
            }
        }
    }

    /** Stop the cleanup timer. Call during graceful shutdown. */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.sessions.clear();
    }

    /** Get current number of active sessions (for monitoring) */
    get size(): number {
        return this.sessions.size;
    }
}
