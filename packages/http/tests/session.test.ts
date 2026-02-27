/**
 * @gao/http — Session Management Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    Session,
    SessionManager,
    MemorySessionStore,
} from '../src/session.js';
import { FlashMessages } from '../src/flash.js';

describe('MemorySessionStore', () => {
    let store: MemorySessionStore;

    beforeEach(() => {
        store = new MemorySessionStore({ maxSessions: 100 });
    });

    it('stores and retrieves session data', async () => {
        await store.set('sess-1', { userId: '123' }, 3600);
        const data = await store.get('sess-1');
        expect(data).toEqual({ userId: '123' });
    });

    it('returns null for expired sessions', async () => {
        await store.set('sess-2', { userId: '123' }, 0); // 0 seconds TTL
        // Wait a bit for expiry
        await new Promise((r) => setTimeout(r, 10));
        const data = await store.get('sess-2');
        expect(data).toBeNull();
    });

    it('returns null for non-existent sessions', async () => {
        const data = await store.get('nonexistent');
        expect(data).toBeNull();
    });

    it('destroys sessions', async () => {
        await store.set('sess-3', { userId: '123' }, 3600);
        await store.destroy('sess-3');
        const data = await store.get('sess-3');
        expect(data).toBeNull();
    });

    it('touches session to renew TTL', async () => {
        await store.set('sess-4', { userId: '123' }, 1);
        await store.touch('sess-4', 3600); // Extend to 1 hour
        const data = await store.get('sess-4');
        expect(data).toEqual({ userId: '123' });
    });
});

describe('Session', () => {
    it('get/set/has/delete work correctly', () => {
        const session = new Session('test-id');
        expect(session.isNew).toBe(true);

        session.set('name', 'Alice');
        expect(session.get('name')).toBe('Alice');
        expect(session.has('name')).toBe(true);
        expect(session.isDirty).toBe(true);

        session.delete('name');
        expect(session.has('name')).toBe(false);
    });

    it('restores from initial data', () => {
        const session = new Session('test-id', { userId: '123' });
        expect(session.isNew).toBe(false);
        expect(session.get('userId')).toBe('123');
    });

    it('returns all data', () => {
        const session = new Session('test-id');
        session.set('a', 1);
        session.set('b', 2);
        expect(session.all()).toEqual({ a: 1, b: 2 });
    });
});

describe('SessionManager', () => {
    let manager: SessionManager;

    beforeEach(() => {
        manager = new SessionManager({
            cookieName: 'test_session',
            ttl: 3600,
            secure: false,
        });
    });

    it('creates new session when no cookie', async () => {
        const session = await manager.loadSession(null);
        expect(session.isNew).toBe(true);
        expect(session.id).toBeDefined();
    });

    it('loads existing session from cookie', async () => {
        // Save a session first
        const session = await manager.loadSession(null);
        session.set('userId', '123');
        const cookie = await manager.saveSession(session);

        // Load from the cookie
        const loaded = await manager.loadSession(`test_session=${session.id}`);
        expect(loaded.isNew).toBe(false);
        expect(loaded.get('userId')).toBe('123');
    });

    it('destroys session', async () => {
        const session = await manager.loadSession(null);
        session.set('userId', '123');
        await manager.saveSession(session);

        const cookie = await manager.destroySession(session);
        expect(cookie).toContain('Max-Age=0');

        const loaded = await manager.loadSession(`test_session=${session.id}`);
        expect(loaded.isNew).toBe(true); // Session was destroyed
    });

    it('regenerates session with new ID', async () => {
        const session = await manager.loadSession(null);
        session.set('userId', '123');
        await manager.saveSession(session);

        const newSession = await manager.regenerateSession(session);
        expect(newSession.id).not.toBe(session.id);
        expect(newSession.get('userId')).toBe('123');
    });

    it('cookie has correct attributes', async () => {
        const session = await manager.loadSession(null);
        const cookie = await manager.saveSession(session);
        expect(cookie).toContain('test_session=');
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('SameSite=Lax');
        expect(cookie).toContain('Path=/');
        expect(cookie).toContain('Max-Age=3600');
    });
});

describe('FlashMessages', () => {
    it('flash data is available after aging', () => {
        const session = new Session('test-id');
        const flash = new FlashMessages(session);

        // Flash a message
        flash.flash('success', 'Contact saved!');

        // Age (simulates next request)
        flash.age();

        // Message should now be available
        expect(flash.get('success')).toBe('Contact saved!');
        expect(flash.has('success')).toBe(true);
    });

    it('flash data disappears after second aging', () => {
        const session = new Session('test-id');
        const flash = new FlashMessages(session);

        flash.flash('error', 'Something failed');
        flash.age(); // Move to old

        // Verify it's there
        expect(flash.get('error')).toBe('Something failed');

        // Age again (simulates another request)
        flash.age();

        // Should be gone now
        expect(flash.get('error')).toBeUndefined();
        expect(flash.has('error')).toBe(false);
    });

    it('returns all flash messages', () => {
        const session = new Session('test-id');
        const flash = new FlashMessages(session);

        flash.flash('success', 'Saved!');
        flash.flash('warning', 'Check fields');
        flash.age();

        const all = flash.all();
        expect(all).toEqual({
            success: 'Saved!',
            warning: 'Check fields',
        });
    });
});
