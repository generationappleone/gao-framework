/**
 * @gao/websocket — Ticket System
 *
 * Issues short-lived, one-time-use tickets for WebSocket handshake.
 * Eliminates sending JWT tokens via URL query strings (which leak
 * in server logs, browser history, and proxy logs).
 *
 * Flow:
 *   1. Client → POST /api/ws/ticket (JWT in Authorization header)
 *   2. Server → { ticket: "random-string", expiresIn: 30 }
 *   3. Client → WS connect with auth: { ticket } (not token)
 *   4. Server → Consume ticket (one-time), allow connection
 *
 * Security properties:
 *   - cryptographically random (32 bytes, base64url)
 *   - one-time use (consumed on first verification)
 *   - short-lived (default 30 seconds, only for handshake)
 *   - IP-bound (optional, enabled by default)
 *   - auto-cleanup of expired tickets
 */

import * as crypto from 'node:crypto';
import type { WsTicketConfig } from './types.js';

// ─── Public Types ─────────────────────────────────────────────

export interface TicketPayload {
    readonly userId: string;
    readonly ip: string;
    readonly roles?: string[];
    readonly metadata?: Record<string, unknown>;
}

export interface TicketIssueResult {
    readonly ticket: string;
    readonly expiresIn: number;
}

// ─── Internal Types ───────────────────────────────────────────

interface StoredTicket {
    readonly userId: string;
    readonly ip: string;
    readonly roles?: string[];
    readonly metadata?: Record<string, unknown>;
    readonly expiresAt: number;
}

// ─── TicketStore ──────────────────────────────────────────────

export class TicketStore {
    private readonly tickets = new Map<string, StoredTicket>();
    private cleanupTimer: ReturnType<typeof setInterval> | undefined;
    private readonly ttlMs: number;
    private readonly ttlSeconds: number;
    private readonly bindToIp: boolean;

    constructor(config: WsTicketConfig = {}) {
        this.ttlSeconds = config.ttlSeconds ?? 30;
        this.ttlMs = this.ttlSeconds * 1000;
        this.bindToIp = config.bindToIp ?? true;

        // Periodic cleanup every 10 seconds
        this.cleanupTimer = setInterval(() => this.cleanup(), 10_000);
        if (this.cleanupTimer.unref) this.cleanupTimer.unref();
    }

    /**
     * Issue a new ticket for the given user.
     * Returns the ticket string and its TTL.
     */
    issue(payload: TicketPayload): TicketIssueResult {
        const ticketId = crypto.randomBytes(32).toString('base64url');
        const expiresAt = Date.now() + this.ttlMs;

        this.tickets.set(ticketId, {
            userId: payload.userId,
            ip: payload.ip,
            roles: payload.roles,
            metadata: payload.metadata,
            expiresAt,
        });

        return {
            ticket: ticketId,
            expiresIn: this.ttlSeconds,
        };
    }

    /**
     * Consume a ticket (one-time use).
     *
     * Returns the original payload if valid, or null if:
     * - The ticket does not exist (already consumed or never issued)
     * - The ticket has expired
     * - The requesting IP does not match (when bindToIp is enabled)
     */
    consume(ticketId: string, requestIp: string): TicketPayload | null {
        const stored = this.tickets.get(ticketId);
        if (!stored) return null;

        // Always delete — one-time use regardless of validity
        this.tickets.delete(ticketId);

        // Check expiry
        if (Date.now() > stored.expiresAt) return null;

        // Check IP binding
        if (this.bindToIp && stored.ip !== requestIp) return null;

        return {
            userId: stored.userId,
            ip: stored.ip,
            roles: stored.roles,
            metadata: stored.metadata,
        };
    }

    /** Number of pending (not yet consumed) tickets. */
    get size(): number {
        return this.tickets.size;
    }

    /** Stop cleanup timer and clear all tickets. */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.tickets.clear();
    }

    /** Remove expired tickets to prevent memory leaks. */
    private cleanup(): void {
        const now = Date.now();
        for (const [id, ticket] of this.tickets) {
            if (now > ticket.expiresAt) {
                this.tickets.delete(id);
            }
        }
    }
}
