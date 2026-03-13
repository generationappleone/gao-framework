/**
 * @gao/websocket — Connection Rate Limiter
 *
 * Protects WebSocket endpoints from connection flooding,
 * brute-force authentication attacks, and resource exhaustion.
 *
 * Three protection layers:
 *   1. Per-IP connection rate (sliding window)
 *   2. Per-user concurrent connection limit
 *   3. Auth failure tracking with IP auto-block
 *
 * All limits are configurable. Periodic cleanup prevents
 * unbounded memory growth from tracked state.
 */

import type { WsRateLimitConfig } from './types.js';

// ─── Result Types ─────────────────────────────────────────────

export interface RateLimitResult {
    /** Whether the action is allowed. */
    readonly allowed: boolean;
    /** Human-readable denial reason (only when allowed=false). */
    readonly reason?: string;
}

// ─── WsRateLimiter ────────────────────────────────────────────

export class WsRateLimiter {
    /** Map<IP, timestamps[]> — sliding window of connection attempts. */
    private readonly connectionAttempts = new Map<string, number[]>();

    /** Map<userId, Set<socketId>> — active concurrent connections. */
    private readonly activeConnections = new Map<string, Set<string>>();

    /** Map<IP, failureCount> — consecutive auth failures per IP. */
    private readonly authFailures = new Map<string, number>();

    /** Map<IP, blockedUntilMs> — temporarily blocked IPs. */
    private readonly blockedIps = new Map<string, number>();

    private readonly maxPerIp: number;
    private readonly windowMs: number;
    private readonly maxPerUser: number;
    private readonly blockThreshold: number;
    private readonly blockDurationMs: number;

    private cleanupTimer: ReturnType<typeof setInterval> | undefined;

    constructor(config: WsRateLimitConfig = {}) {
        this.maxPerIp = config.maxConnectionsPerIp ?? 10;
        this.windowMs = config.windowMs ?? 10_000;
        this.maxPerUser = config.maxConnectionsPerUser ?? 5;
        this.blockThreshold = config.blockAfterFailures ?? 20;
        this.blockDurationMs = config.blockDurationMs ?? 300_000; // 5 minutes

        // Cleanup every 30 seconds
        this.cleanupTimer = setInterval(() => this.cleanup(), 30_000);
        if (this.cleanupTimer.unref) this.cleanupTimer.unref();
    }

    // ── Layer 1: Per-IP Connection Rate ───────────────────────

    /**
     * Check if a new connection from this IP is allowed.
     * Uses a sliding window to count recent connection attempts.
     */
    allowConnection(ip: string): RateLimitResult {
        // Check IP block list first
        const blockedUntil = this.blockedIps.get(ip);
        if (blockedUntil !== undefined) {
            if (Date.now() < blockedUntil) {
                return { allowed: false, reason: 'IP temporarily blocked due to too many auth failures' };
            }
            // Block expired — remove
            this.blockedIps.delete(ip);
        }

        // Sliding window rate check
        const now = Date.now();
        const windowStart = now - this.windowMs;

        let attempts = this.connectionAttempts.get(ip);
        if (!attempts) {
            attempts = [];
            this.connectionAttempts.set(ip, attempts);
        }

        // Purge entries outside the window
        let validIdx = 0;
        while (validIdx < attempts.length && attempts[validIdx]! <= windowStart) {
            validIdx++;
        }
        if (validIdx > 0) {
            attempts.splice(0, validIdx);
        }

        // Check rate
        if (attempts.length >= this.maxPerIp) {
            return {
                allowed: false,
                reason: `Too many connections from this IP (max ${this.maxPerIp} per ${this.windowMs}ms)`,
            };
        }

        // Record this attempt
        attempts.push(now);

        return { allowed: true };
    }

    // ── Layer 2: Per-User Concurrent Connections ──────────────

    /**
     * Check if a user can open another concurrent connection.
     */
    allowUserConnection(userId: string): RateLimitResult {
        const active = this.activeConnections.get(userId);
        if (active && active.size >= this.maxPerUser) {
            return {
                allowed: false,
                reason: `Max concurrent connections reached (max ${this.maxPerUser} per user)`,
            };
        }
        return { allowed: true };
    }

    /**
     * Track an active connection for a user.
     * Call this after successful authentication.
     */
    trackConnection(userId: string, socketId: string): void {
        let set = this.activeConnections.get(userId);
        if (!set) {
            set = new Set();
            this.activeConnections.set(userId, set);
        }
        set.add(socketId);
    }

    /**
     * Remove a tracked connection (called on disconnect).
     */
    removeConnection(userId: string, socketId: string): void {
        const set = this.activeConnections.get(userId);
        if (!set) return;

        set.delete(socketId);
        if (set.size === 0) {
            this.activeConnections.delete(userId);
        }
    }

    /**
     * Get the count of active connections for a user.
     */
    getActiveCount(userId: string): number {
        return this.activeConnections.get(userId)?.size ?? 0;
    }

    // ── Layer 3: Auth Failure Tracking ─────────────────────────

    /**
     * Record an authentication failure from an IP.
     * If the threshold is exceeded, the IP is blocked.
     */
    recordAuthFailure(ip: string): void {
        const count = (this.authFailures.get(ip) ?? 0) + 1;
        this.authFailures.set(ip, count);

        if (count >= this.blockThreshold) {
            this.blockedIps.set(ip, Date.now() + this.blockDurationMs);
            this.authFailures.delete(ip);
        }
    }

    /**
     * Reset auth failure count for an IP (on successful auth).
     */
    resetAuthFailures(ip: string): void {
        this.authFailures.delete(ip);
    }

    /**
     * Check if an IP is currently blocked.
     */
    isBlocked(ip: string): boolean {
        const blockedUntil = this.blockedIps.get(ip);
        if (blockedUntil === undefined) return false;

        if (Date.now() >= blockedUntil) {
            this.blockedIps.delete(ip);
            return false;
        }

        return true;
    }

    /**
     * Get the current auth failure count for an IP.
     */
    getAuthFailureCount(ip: string): number {
        return this.authFailures.get(ip) ?? 0;
    }

    // ── Lifecycle ─────────────────────────────────────────────

    /** Stop cleanup timer and release all resources. */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.connectionAttempts.clear();
        this.activeConnections.clear();
        this.authFailures.clear();
        this.blockedIps.clear();
    }

    // ── Internal Cleanup ──────────────────────────────────────

    private cleanup(): void {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        // Clean expired window entries
        for (const [ip, attempts] of this.connectionAttempts) {
            let validIdx = 0;
            while (validIdx < attempts.length && attempts[validIdx]! <= windowStart) {
                validIdx++;
            }
            if (validIdx === attempts.length) {
                this.connectionAttempts.delete(ip);
            } else if (validIdx > 0) {
                attempts.splice(0, validIdx);
            }
        }

        // Clean expired IP blocks
        for (const [ip, until] of this.blockedIps) {
            if (now >= until) {
                this.blockedIps.delete(ip);
            }
        }
    }
}
