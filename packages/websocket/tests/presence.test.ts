import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PresenceTracker } from '../src/presence.js';

const createMockLogger = () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
});

describe('PresenceTracker', () => {
    let tracker: PresenceTracker;

    beforeEach(() => {
        const logger = createMockLogger();
        tracker = new PresenceTracker(logger as any);
    });

    it('should track a new connection', () => {
        tracker.connect('user-1', 'socket-1');
        expect(tracker.isOnline('user-1')).toBe(true);
        expect(tracker.onlineCount).toBe(1);
    });

    it('should support multiple connections per user', () => {
        tracker.connect('user-1', 'socket-1');
        tracker.connect('user-1', 'socket-2');
        expect(tracker.getUserSockets('user-1')).toEqual(['socket-1', 'socket-2']);
        expect(tracker.onlineCount).toBe(1); // Still 1 user
    });

    it('should handle disconnect', () => {
        tracker.connect('user-1', 'socket-1');
        const info = tracker.disconnect('socket-1');
        expect(info?.userId).toBe('user-1');
        expect(tracker.isOnline('user-1')).toBe(false);
        expect(tracker.onlineCount).toBe(0);
    });

    it('should keep user online if other connections exist', () => {
        tracker.connect('user-1', 'socket-1');
        tracker.connect('user-1', 'socket-2');
        tracker.disconnect('socket-1');
        expect(tracker.isOnline('user-1')).toBe(true);
        expect(tracker.getUserSockets('user-1')).toEqual(['socket-2']);
    });

    it('should return undefined for unknown socket disconnect', () => {
        const info = tracker.disconnect('unknown');
        expect(info).toBeUndefined();
    });

    it('should list all online users', () => {
        tracker.connect('user-1', 'socket-1');
        tracker.connect('user-2', 'socket-2');
        tracker.connect('user-3', 'socket-3');
        expect(tracker.getOnlineUsers().sort()).toEqual(['user-1', 'user-2', 'user-3']);
    });

    it('should get socket info', () => {
        tracker.connect('user-1', 'socket-1', { device: 'mobile' });
        const info = tracker.getSocketInfo('socket-1');
        expect(info?.userId).toBe('user-1');
        expect(info?.metadata).toEqual({ device: 'mobile' });
        expect(info?.connectedAt).toBeGreaterThan(0);
    });

    it('should clear all data', () => {
        tracker.connect('user-1', 'socket-1');
        tracker.connect('user-2', 'socket-2');
        tracker.clear();
        expect(tracker.onlineCount).toBe(0);
        expect(tracker.getOnlineUsers()).toEqual([]);
    });
});
