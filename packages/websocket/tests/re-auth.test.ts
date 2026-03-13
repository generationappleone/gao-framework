import { describe, it, expect, afterEach, vi } from 'vitest';
import { ReAuthHandler } from '../src/re-auth.js';
import type { SocketUser, AuthVerifyFn } from '../src/types.js';

// ─── Test Helpers ────────────────────────────────────────────

const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

const validUser: SocketUser = { id: 'user-123', roles: ['user'] };

const successVerify: AuthVerifyFn = async () => validUser;
const failVerify: AuthVerifyFn = async () => null;
const errorVerify: AuthVerifyFn = async () => { throw new Error('Verification error'); };

describe('ReAuthHandler', () => {
    let handler: ReAuthHandler;

    afterEach(() => {
        handler?.destroy();
        vi.restoreAllMocks();
    });

    // ── Schedule ──────────────────────────────────────────────

    describe('schedule', () => {
        it('should schedule re-auth for a socket', () => {
            handler = new ReAuthHandler(successVerify, mockLogger as any, {
                intervalMinutes: 1,
                gracePeriodSeconds: 10,
            });

            const emitFn = vi.fn();
            const disconnectFn = vi.fn();

            handler.schedule('socket-1', emitFn, disconnectFn);

            expect(handler.isScheduled('socket-1')).toBe(true);
            expect(handler.activeCount).toBe(1);
        });

        it('should emit auth:renew when interval fires', () => {
            vi.useFakeTimers();

            handler = new ReAuthHandler(successVerify, mockLogger as any, {
                intervalMinutes: 1,
                gracePeriodSeconds: 10,
            });

            const emitFn = vi.fn();
            const disconnectFn = vi.fn();

            handler.schedule('socket-1', emitFn, disconnectFn);

            // Advance timer past the interval (1 minute)
            vi.advanceTimersByTime(60_001);

            expect(emitFn).toHaveBeenCalledWith('auth:renew', expect.objectContaining({
                deadline: 10_000,
            }));

            vi.useRealTimers();
        });

        it('should disconnect if grace period expires without response', () => {
            vi.useFakeTimers();

            handler = new ReAuthHandler(successVerify, mockLogger as any, {
                intervalMinutes: 1,
                gracePeriodSeconds: 5,
            });

            const emitFn = vi.fn();
            const disconnectFn = vi.fn();

            handler.schedule('socket-1', emitFn, disconnectFn);

            // Trigger re-auth
            vi.advanceTimersByTime(60_001);
            expect(emitFn).toHaveBeenCalled();

            // Advance past grace period without responding
            vi.advanceTimersByTime(5_001);
            expect(disconnectFn).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should replace existing schedule for the same socket', () => {
            handler = new ReAuthHandler(successVerify, mockLogger as any);

            const emitFn1 = vi.fn();
            const emitFn2 = vi.fn();
            const disconnectFn = vi.fn();

            handler.schedule('socket-1', emitFn1, disconnectFn);
            handler.schedule('socket-1', emitFn2, disconnectFn);

            // Only one schedule should be active
            expect(handler.activeCount).toBe(1);
        });
    });

    // ── handleResponse ────────────────────────────────────────

    describe('handleResponse', () => {
        it('should return user on valid token', async () => {
            handler = new ReAuthHandler(successVerify, mockLogger as any);
            handler.schedule('socket-1', vi.fn(), vi.fn());

            const user = await handler.handleResponse('socket-1', 'valid-token');
            expect(user).not.toBeNull();
            expect(user!.id).toBe('user-123');
        });

        it('should return null on invalid token', async () => {
            handler = new ReAuthHandler(failVerify, mockLogger as any);
            handler.schedule('socket-1', vi.fn(), vi.fn());

            const user = await handler.handleResponse('socket-1', 'invalid-token');
            expect(user).toBeNull();
        });

        it('should return null on verification error', async () => {
            handler = new ReAuthHandler(errorVerify, mockLogger as any);
            handler.schedule('socket-1', vi.fn(), vi.fn());

            const user = await handler.handleResponse('socket-1', 'error-token');
            expect(user).toBeNull();
        });

        it('should cancel grace timer on response', () => {
            vi.useFakeTimers();

            handler = new ReAuthHandler(successVerify, mockLogger as any, {
                intervalMinutes: 1,
                gracePeriodSeconds: 5,
            });

            const emitFn = vi.fn();
            const disconnectFn = vi.fn();

            handler.schedule('socket-1', emitFn, disconnectFn);

            // Trigger re-auth
            vi.advanceTimersByTime(60_001);

            // Respond before grace period expires
            void handler.handleResponse('socket-1', 'valid-token');

            // Advance past grace period
            vi.advanceTimersByTime(6_000);

            // Should NOT have disconnected (grace timer was cancelled)
            expect(disconnectFn).not.toHaveBeenCalled();

            vi.useRealTimers();
        });
    });

    // ── Cleanup ───────────────────────────────────────────────

    describe('cleanup', () => {
        it('should remove timers for a specific socket', () => {
            handler = new ReAuthHandler(successVerify, mockLogger as any);
            handler.schedule('socket-1', vi.fn(), vi.fn());
            handler.schedule('socket-2', vi.fn(), vi.fn());

            expect(handler.activeCount).toBe(2);

            handler.cleanup('socket-1');

            expect(handler.isScheduled('socket-1')).toBe(false);
            expect(handler.isScheduled('socket-2')).toBe(true);
            expect(handler.activeCount).toBe(1);
        });

        it('should handle cleanup of non-existent socket gracefully', () => {
            handler = new ReAuthHandler(successVerify, mockLogger as any);

            // Should not throw
            handler.cleanup('nonexistent');
            expect(handler.activeCount).toBe(0);
        });
    });

    // ── Destroy ───────────────────────────────────────────────

    describe('destroy', () => {
        it('should clear all active schedules', () => {
            handler = new ReAuthHandler(successVerify, mockLogger as any);
            handler.schedule('socket-1', vi.fn(), vi.fn());
            handler.schedule('socket-2', vi.fn(), vi.fn());
            handler.schedule('socket-3', vi.fn(), vi.fn());

            expect(handler.activeCount).toBe(3);

            handler.destroy();

            expect(handler.activeCount).toBe(0);
        });
    });

    // ── Defaults ──────────────────────────────────────────────

    describe('defaults', () => {
        it('should use 30 minute interval by default', () => {
            vi.useFakeTimers();

            handler = new ReAuthHandler(successVerify, mockLogger as any);

            const emitFn = vi.fn();
            handler.schedule('socket-1', emitFn, vi.fn());

            // Should NOT fire at 29 minutes
            vi.advanceTimersByTime(29 * 60_000);
            expect(emitFn).not.toHaveBeenCalled();

            // Should fire at 30 minutes
            vi.advanceTimersByTime(1 * 60_000 + 1);
            expect(emitFn).toHaveBeenCalled();

            vi.useRealTimers();
        });
    });
});
