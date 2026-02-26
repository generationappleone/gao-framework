import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChannelManager } from '../src/channel.js';

const createMockLogger = () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
});

describe('ChannelManager', () => {
    let manager: ChannelManager;

    beforeEach(() => {
        const logger = createMockLogger();
        manager = new ChannelManager(logger as any);
    });

    it('should create a channel on first join', () => {
        const result = manager.join('general', 'socket-1');
        expect(result).toBe(true);
        expect(manager.hasChannel('general')).toBe(true);
    });

    it('should track channel members', () => {
        manager.join('general', 'socket-1');
        manager.join('general', 'socket-2');
        expect(manager.getMembers('general')).toEqual(['socket-1', 'socket-2']);
        expect(manager.getMemberCount('general')).toBe(2);
    });

    it('should enforce maxMembers limit', () => {
        manager.join('small-room', 'socket-1', { maxMembers: 2 });
        manager.join('small-room', 'socket-2');
        const result = manager.join('small-room', 'socket-3');
        expect(result).toBe(false);
        expect(manager.getMemberCount('small-room')).toBe(2);
    });

    it('should remove member on leave', () => {
        manager.join('general', 'socket-1');
        manager.join('general', 'socket-2');
        manager.leave('general', 'socket-1');
        expect(manager.getMembers('general')).toEqual(['socket-2']);
    });

    it('should auto-delete empty channels', () => {
        manager.join('temp', 'socket-1');
        manager.leave('temp', 'socket-1');
        expect(manager.hasChannel('temp')).toBe(false);
    });

    it('should leave all channels on disconnect', () => {
        manager.join('chan-a', 'socket-1');
        manager.join('chan-b', 'socket-1');
        manager.join('chan-a', 'socket-2');

        const left = manager.leaveAll('socket-1');
        expect(left.sort()).toEqual(['chan-a', 'chan-b']);
        expect(manager.hasChannel('chan-b')).toBe(false); // auto-deleted (empty)
        expect(manager.hasChannel('chan-a')).toBe(true); // socket-2 still in
    });

    it('should list all channel names', () => {
        manager.join('alpha', 'socket-1');
        manager.join('beta', 'socket-2');
        expect(manager.getChannelNames().sort()).toEqual(['alpha', 'beta']);
    });

    it('should return empty for nonexistent channel', () => {
        expect(manager.getMembers('nonexistent')).toEqual([]);
        expect(manager.getMemberCount('nonexistent')).toBe(0);
    });

    it('should clear all channels', () => {
        manager.join('a', 'socket-1');
        manager.join('b', 'socket-2');
        manager.clear();
        expect(manager.getChannelNames()).toEqual([]);
    });
});
