import { describe, it, expect, afterEach } from 'vitest';
import { WsRateLimiter } from '../src/ws-rate-limiter.js';

describe('WsRateLimiter', () => {
    let limiter: WsRateLimiter;

    afterEach(() => {
        limiter?.destroy();
    });

    // ── Layer 1: Per-IP Rate Limiting ─────────────────────────

    describe('allowConnection (per-IP rate)', () => {
        it('should allow connections within the limit', () => {
            limiter = new WsRateLimiter({ maxConnectionsPerIp: 5, windowMs: 10_000 });

            for (let i = 0; i < 5; i++) {
                const result = limiter.allowConnection('10.0.0.1');
                expect(result.allowed).toBe(true);
            }
        });

        it('should deny connections exceeding per-IP limit', () => {
            limiter = new WsRateLimiter({ maxConnectionsPerIp: 3, windowMs: 10_000 });

            // Exhaust the limit
            limiter.allowConnection('10.0.0.1');
            limiter.allowConnection('10.0.0.1');
            limiter.allowConnection('10.0.0.1');

            // 4th should be denied
            const result = limiter.allowConnection('10.0.0.1');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Too many connections');
        });

        it('should track IPs independently', () => {
            limiter = new WsRateLimiter({ maxConnectionsPerIp: 2, windowMs: 10_000 });

            limiter.allowConnection('10.0.0.1');
            limiter.allowConnection('10.0.0.1');

            // IP 1 exhausted, but IP 2 is independent
            expect(limiter.allowConnection('10.0.0.1').allowed).toBe(false);
            expect(limiter.allowConnection('10.0.0.2').allowed).toBe(true);
        });

        it('should allow connections after window expires', async () => {
            limiter = new WsRateLimiter({ maxConnectionsPerIp: 1, windowMs: 50 });

            limiter.allowConnection('10.0.0.1');
            expect(limiter.allowConnection('10.0.0.1').allowed).toBe(false);

            // Wait for window to expire
            await new Promise((r) => setTimeout(r, 70));

            expect(limiter.allowConnection('10.0.0.1').allowed).toBe(true);
        });

        it('should use default of 10 connections per 10s window', () => {
            limiter = new WsRateLimiter();

            for (let i = 0; i < 10; i++) {
                expect(limiter.allowConnection('10.0.0.1').allowed).toBe(true);
            }
            expect(limiter.allowConnection('10.0.0.1').allowed).toBe(false);
        });
    });

    // ── Layer 2: Per-User Concurrent Connections ──────────────

    describe('allowUserConnection (concurrent limit)', () => {
        it('should allow concurrent connections within the limit', () => {
            limiter = new WsRateLimiter({ maxConnectionsPerUser: 3 });

            limiter.trackConnection('user-1', 'socket-1');
            limiter.trackConnection('user-1', 'socket-2');

            expect(limiter.allowUserConnection('user-1').allowed).toBe(true);
        });

        it('should deny connections exceeding per-user limit', () => {
            limiter = new WsRateLimiter({ maxConnectionsPerUser: 2 });

            limiter.trackConnection('user-1', 'socket-1');
            limiter.trackConnection('user-1', 'socket-2');

            // Already at max — should deny
            const result = limiter.allowUserConnection('user-1');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Max concurrent connections');
        });

        it('should track users independently', () => {
            limiter = new WsRateLimiter({ maxConnectionsPerUser: 1 });

            limiter.trackConnection('user-1', 'socket-1');

            expect(limiter.allowUserConnection('user-1').allowed).toBe(false);
            expect(limiter.allowUserConnection('user-2').allowed).toBe(true);
        });

        it('should allow new connections after disconnect', () => {
            limiter = new WsRateLimiter({ maxConnectionsPerUser: 1 });

            limiter.trackConnection('user-1', 'socket-1');
            expect(limiter.allowUserConnection('user-1').allowed).toBe(false);

            limiter.removeConnection('user-1', 'socket-1');
            expect(limiter.allowUserConnection('user-1').allowed).toBe(true);
        });

        it('should report active connection count', () => {
            limiter = new WsRateLimiter();

            expect(limiter.getActiveCount('user-1')).toBe(0);

            limiter.trackConnection('user-1', 'socket-1');
            limiter.trackConnection('user-1', 'socket-2');
            expect(limiter.getActiveCount('user-1')).toBe(2);

            limiter.removeConnection('user-1', 'socket-1');
            expect(limiter.getActiveCount('user-1')).toBe(1);
        });

        it('should handle removing non-existent connections gracefully', () => {
            limiter = new WsRateLimiter();

            // Should not throw
            limiter.removeConnection('nonexistent', 'socket-1');
            expect(limiter.getActiveCount('nonexistent')).toBe(0);
        });

        it('should use default of 5 concurrent connections', () => {
            limiter = new WsRateLimiter();

            for (let i = 1; i <= 5; i++) {
                limiter.trackConnection('user-1', `socket-${i}`);
            }

            expect(limiter.allowUserConnection('user-1').allowed).toBe(false);
        });
    });

    // ── Layer 3: Auth Failure Tracking ─────────────────────────

    describe('auth failure tracking', () => {
        it('should track auth failures per IP', () => {
            limiter = new WsRateLimiter({ blockAfterFailures: 5 });

            limiter.recordAuthFailure('10.0.0.1');
            limiter.recordAuthFailure('10.0.0.1');
            limiter.recordAuthFailure('10.0.0.1');

            expect(limiter.getAuthFailureCount('10.0.0.1')).toBe(3);
            expect(limiter.isBlocked('10.0.0.1')).toBe(false);
        });

        it('should block IP after reaching failure threshold', () => {
            limiter = new WsRateLimiter({ blockAfterFailures: 3, blockDurationMs: 60_000 });

            limiter.recordAuthFailure('10.0.0.1');
            limiter.recordAuthFailure('10.0.0.1');
            limiter.recordAuthFailure('10.0.0.1'); // Threshold reached

            expect(limiter.isBlocked('10.0.0.1')).toBe(true);
        });

        it('should deny connections from blocked IP', () => {
            limiter = new WsRateLimiter({ blockAfterFailures: 2, blockDurationMs: 60_000 });

            limiter.recordAuthFailure('10.0.0.1');
            limiter.recordAuthFailure('10.0.0.1'); // Blocked

            const result = limiter.allowConnection('10.0.0.1');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('blocked');
        });

        it('should unblock IP after block duration expires', async () => {
            limiter = new WsRateLimiter({ blockAfterFailures: 1, blockDurationMs: 50 });

            limiter.recordAuthFailure('10.0.0.1'); // Immediate block

            expect(limiter.isBlocked('10.0.0.1')).toBe(true);

            // Wait for block to expire
            await new Promise((r) => setTimeout(r, 70));

            expect(limiter.isBlocked('10.0.0.1')).toBe(false);
            expect(limiter.allowConnection('10.0.0.1').allowed).toBe(true);
        });

        it('should reset failure count on successful auth', () => {
            limiter = new WsRateLimiter({ blockAfterFailures: 5 });

            limiter.recordAuthFailure('10.0.0.1');
            limiter.recordAuthFailure('10.0.0.1');
            expect(limiter.getAuthFailureCount('10.0.0.1')).toBe(2);

            limiter.resetAuthFailures('10.0.0.1');
            expect(limiter.getAuthFailureCount('10.0.0.1')).toBe(0);
        });

        it('should clear failure count when IP gets blocked', () => {
            limiter = new WsRateLimiter({ blockAfterFailures: 2 });

            limiter.recordAuthFailure('10.0.0.1');
            limiter.recordAuthFailure('10.0.0.1'); // Blocked

            // After blocking, failure count is cleared
            expect(limiter.getAuthFailureCount('10.0.0.1')).toBe(0);
        });

        it('should use default threshold of 20 failures', () => {
            limiter = new WsRateLimiter();

            for (let i = 0; i < 19; i++) {
                limiter.recordAuthFailure('10.0.0.1');
            }
            expect(limiter.isBlocked('10.0.0.1')).toBe(false);

            limiter.recordAuthFailure('10.0.0.1'); // 20th — threshold
            expect(limiter.isBlocked('10.0.0.1')).toBe(true);
        });
    });

    // ── Destroy ──────────────────────────────────────────────

    describe('destroy', () => {
        it('should clear all tracked state', () => {
            limiter = new WsRateLimiter({ maxConnectionsPerIp: 100 });

            limiter.allowConnection('10.0.0.1');
            limiter.trackConnection('user-1', 'socket-1');
            limiter.recordAuthFailure('10.0.0.1');

            limiter.destroy();

            // All state should be cleared
            expect(limiter.getActiveCount('user-1')).toBe(0);
            expect(limiter.getAuthFailureCount('10.0.0.1')).toBe(0);
            expect(limiter.isBlocked('10.0.0.1')).toBe(false);
        });
    });
});
