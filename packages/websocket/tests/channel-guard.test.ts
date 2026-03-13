import { describe, it, expect } from 'vitest';
import { ChannelGuard } from '../src/channel-guard.js';
import type { SocketUser } from '../src/types.js';

// ─── Test Helpers ────────────────────────────────────────────

const authenticatedUser: SocketUser = { id: 'user-123' };
const adminUser: SocketUser = { id: 'admin-1', roles: ['admin', 'user'] };
const moderatorUser: SocketUser = { id: 'mod-1', roles: ['moderator'] };

describe('ChannelGuard', () => {
    // ── No Rules (Open Channels) ──────────────────────────────

    describe('no rules configured', () => {
        it('should allow any channel when no rules are defined', () => {
            const guard = new ChannelGuard();

            expect(guard.authorize('any-channel', undefined).allowed).toBe(true);
            expect(guard.authorize('some-room', authenticatedUser).allowed).toBe(true);
        });

        it('should report zero rule count', () => {
            const guard = new ChannelGuard();
            expect(guard.ruleCount).toBe(0);
        });
    });

    // ── requireAuth ───────────────────────────────────────────

    describe('requireAuth', () => {
        it('should deny unauthenticated users on private channels', () => {
            const guard = new ChannelGuard({
                'private-*': { requireAuth: true },
            });

            const result = guard.authorize('private-chat', undefined);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Authentication required');
        });

        it('should allow authenticated users on private channels', () => {
            const guard = new ChannelGuard({
                'private-*': { requireAuth: true },
            });

            const result = guard.authorize('private-chat', authenticatedUser);
            expect(result.allowed).toBe(true);
        });

        it('should allow unmatched channels even for unauthenticated users', () => {
            const guard = new ChannelGuard({
                'private-*': { requireAuth: true },
            });

            // 'public-chat' doesn't match 'private-*', so no rule applies
            const result = guard.authorize('public-chat', undefined);
            expect(result.allowed).toBe(true);
        });
    });

    // ── Wildcard Pattern Matching ──────────────────────────────

    describe('wildcard patterns', () => {
        it('should match wildcard patterns correctly', () => {
            const guard = new ChannelGuard({
                'presence-*': { requireAuth: true },
            });

            expect(guard.authorize('presence-lobby', authenticatedUser).allowed).toBe(true);
            expect(guard.authorize('presence-room-123', authenticatedUser).allowed).toBe(true);
            expect(guard.authorize('presence-', authenticatedUser).allowed).toBe(true);
        });

        it('should not match partial prefixes', () => {
            const guard = new ChannelGuard({
                'admin-*': { requireAuth: true, requiredRoles: ['admin'] },
            });

            // 'administrator' does not start with 'admin-'
            const result = guard.authorize('administrator', authenticatedUser);
            expect(result.allowed).toBe(true); // No rule matched → open
        });
    });

    // ── requiredRoles ─────────────────────────────────────────

    describe('requiredRoles', () => {
        it('should deny users without required roles', () => {
            const guard = new ChannelGuard({
                'admin-*': { requireAuth: true, requiredRoles: ['admin'] },
            });

            const result = guard.authorize('admin-dashboard', authenticatedUser);
            // authenticatedUser has no roles property
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Insufficient permissions');
        });

        it('should allow users with at least one required role', () => {
            const guard = new ChannelGuard({
                'admin-*': { requireAuth: true, requiredRoles: ['admin', 'superadmin'] },
            });

            const result = guard.authorize('admin-dashboard', adminUser);
            expect(result.allowed).toBe(true);
        });

        it('should deny users with wrong roles', () => {
            const guard = new ChannelGuard({
                'admin-*': { requireAuth: true, requiredRoles: ['admin'] },
            });

            const result = guard.authorize('admin-dashboard', moderatorUser);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Insufficient permissions');
        });

        it('should deny unauthenticated users when roles are required', () => {
            const guard = new ChannelGuard({
                'admin-*': { requiredRoles: ['admin'] },
            });

            const result = guard.authorize('admin-dashboard', undefined);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Authentication required');
        });
    });

    // ── ownerOnly with {id} Capture ────────────────────────────

    describe('ownerOnly with {id} capture', () => {
        it('should allow the owner to join their own channel', () => {
            const guard = new ChannelGuard({
                'user-{id}': { requireAuth: true, ownerOnly: true },
            });

            const result = guard.authorize('user-user-123', authenticatedUser);
            expect(result.allowed).toBe(true);
        });

        it('should deny a different user from joining an owner channel', () => {
            const guard = new ChannelGuard({
                'user-{id}': { requireAuth: true, ownerOnly: true },
            });

            const result = guard.authorize('user-user-456', authenticatedUser);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Access denied — not the owner');
        });

        it('should deny unauthenticated users on owner channels', () => {
            const guard = new ChannelGuard({
                'user-{id}': { requireAuth: true, ownerOnly: true },
            });

            const result = guard.authorize('user-user-123', undefined);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Authentication required');
        });

        it('should handle missing user when ownerOnly is set but requireAuth is not', () => {
            const guard = new ChannelGuard({
                'inbox-{id}': { ownerOnly: true },
            });

            const result = guard.authorize('inbox-user-123', undefined);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Authentication required');
        });
    });

    // ── Exact Match ───────────────────────────────────────────

    describe('exact match patterns', () => {
        it('should match exact channel names', () => {
            const guard = new ChannelGuard({
                'system-broadcast': { requireAuth: false },
            });

            const result = guard.authorize('system-broadcast', undefined);
            expect(result.allowed).toBe(true);
            expect(result.rule).toBeDefined();
        });

        it('should not match partial names', () => {
            const guard = new ChannelGuard({
                'system': { requireAuth: true },
            });

            // 'system-broadcast' ≠ 'system'
            const result = guard.authorize('system-broadcast', undefined);
            expect(result.allowed).toBe(true); // No rule matched → open
            expect(result.rule).toBeUndefined();
        });
    });

    // ── Rule Returned ────────────────────────────────────────

    describe('rule in result', () => {
        it('should return the matched rule', () => {
            const guard = new ChannelGuard({
                'private-*': { requireAuth: true, broadcastPresence: true, maxMembers: 50 },
            });

            const result = guard.authorize('private-room', authenticatedUser);
            expect(result.allowed).toBe(true);
            expect(result.rule).toBeDefined();
            expect(result.rule!.broadcastPresence).toBe(true);
            expect(result.rule!.maxMembers).toBe(50);
        });

        it('should return undefined rule when no pattern matches', () => {
            const guard = new ChannelGuard({
                'private-*': { requireAuth: true },
            });

            const result = guard.authorize('open-channel', undefined);
            expect(result.rule).toBeUndefined();
        });
    });

    // ── Multiple Rules ───────────────────────────────────────

    describe('multiple rules', () => {
        it('should check rules in order and match first', () => {
            const guard = new ChannelGuard({
                'private-*': { requireAuth: true },
                'admin-*': { requireAuth: true, requiredRoles: ['admin'] },
                'user-{id}': { requireAuth: true, ownerOnly: true },
            });

            expect(guard.ruleCount).toBe(3);

            // Test each pattern
            expect(guard.authorize('private-room', undefined).allowed).toBe(false);
            expect(guard.authorize('private-room', authenticatedUser).allowed).toBe(true);

            expect(guard.authorize('admin-panel', authenticatedUser).allowed).toBe(false);
            expect(guard.authorize('admin-panel', adminUser).allowed).toBe(true);

            expect(guard.authorize('user-user-123', authenticatedUser).allowed).toBe(true);
            expect(guard.authorize('user-admin-1', authenticatedUser).allowed).toBe(false);
        });
    });
});
