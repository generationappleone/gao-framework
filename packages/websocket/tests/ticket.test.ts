import { describe, it, expect, afterEach, vi } from 'vitest';
import { TicketStore } from '../src/ticket.js';

describe('TicketStore', () => {
    let store: TicketStore;

    afterEach(() => {
        store?.destroy();
    });

    // ── Issue ────────────────────────────────────────────────

    it('should issue a ticket with a unique base64url string', () => {
        store = new TicketStore({ ttlSeconds: 30, bindToIp: true });
        const result = store.issue({ userId: 'u1', ip: '127.0.0.1' });

        expect(result.ticket).toBeDefined();
        expect(typeof result.ticket).toBe('string');
        expect(result.ticket.length).toBeGreaterThan(20);
        expect(result.expiresIn).toBe(30);
    });

    it('should issue unique tickets each time', () => {
        store = new TicketStore();
        const a = store.issue({ userId: 'u1', ip: '127.0.0.1' });
        const b = store.issue({ userId: 'u1', ip: '127.0.0.1' });

        expect(a.ticket).not.toBe(b.ticket);
    });

    it('should track pending ticket count', () => {
        store = new TicketStore();
        expect(store.size).toBe(0);

        store.issue({ userId: 'u1', ip: '127.0.0.1' });
        store.issue({ userId: 'u2', ip: '127.0.0.2' });
        expect(store.size).toBe(2);
    });

    // ── Consume ──────────────────────────────────────────────

    it('should consume a valid ticket and return payload', () => {
        store = new TicketStore({ ttlSeconds: 30, bindToIp: true });

        const result = store.issue({
            userId: 'u1',
            ip: '10.0.0.1',
            roles: ['admin'],
            metadata: { source: 'test' },
        });

        const payload = store.consume(result.ticket, '10.0.0.1');

        expect(payload).not.toBeNull();
        expect(payload!.userId).toBe('u1');
        expect(payload!.ip).toBe('10.0.0.1');
        expect(payload!.roles).toEqual(['admin']);
        expect(payload!.metadata).toEqual({ source: 'test' });
    });

    it('should return null for a non-existent ticket', () => {
        store = new TicketStore();

        const payload = store.consume('nonexistent-ticket', '127.0.0.1');
        expect(payload).toBeNull();
    });

    // ── One-Time Use ─────────────────────────────────────────

    it('should only allow consuming a ticket once (one-time use)', () => {
        store = new TicketStore({ bindToIp: false });

        const result = store.issue({ userId: 'u1', ip: '127.0.0.1' });

        // First consume should succeed
        const first = store.consume(result.ticket, '127.0.0.1');
        expect(first).not.toBeNull();

        // Second consume should fail — ticket already used
        const second = store.consume(result.ticket, '127.0.0.1');
        expect(second).toBeNull();
    });

    it('should reduce pending count after consume', () => {
        store = new TicketStore({ bindToIp: false });
        const result = store.issue({ userId: 'u1', ip: '127.0.0.1' });
        expect(store.size).toBe(1);

        store.consume(result.ticket, '127.0.0.1');
        expect(store.size).toBe(0);
    });

    // ── Expiry ───────────────────────────────────────────────

    it('should reject an expired ticket', () => {
        store = new TicketStore({ ttlSeconds: 1, bindToIp: false });

        const result = store.issue({ userId: 'u1', ip: '127.0.0.1' });

        // Simulate time passing beyond TTL
        vi.useFakeTimers();
        vi.advanceTimersByTime(1500); // 1.5 seconds > 1 second TTL

        const payload = store.consume(result.ticket, '127.0.0.1');
        expect(payload).toBeNull();

        vi.useRealTimers();
    });

    it('should delete expired ticket even if rejected', () => {
        store = new TicketStore({ ttlSeconds: 1, bindToIp: false });

        const result = store.issue({ userId: 'u1', ip: '127.0.0.1' });
        expect(store.size).toBe(1);

        vi.useFakeTimers();
        vi.advanceTimersByTime(1500);

        store.consume(result.ticket, '127.0.0.1');
        // Ticket should be deleted even though it was expired
        expect(store.size).toBe(0);

        vi.useRealTimers();
    });

    // ── IP Binding ───────────────────────────────────────────

    it('should reject a ticket from a different IP when bindToIp is enabled', () => {
        store = new TicketStore({ ttlSeconds: 30, bindToIp: true });

        const result = store.issue({ userId: 'u1', ip: '10.0.0.1' });

        // Attempt to use from a different IP
        const payload = store.consume(result.ticket, '10.0.0.2');
        expect(payload).toBeNull();
    });

    it('should accept a ticket from a different IP when bindToIp is disabled', () => {
        store = new TicketStore({ ttlSeconds: 30, bindToIp: false });

        const result = store.issue({ userId: 'u1', ip: '10.0.0.1' });

        // Different IP should work when binding is disabled
        const payload = store.consume(result.ticket, '10.0.0.2');
        expect(payload).not.toBeNull();
        expect(payload!.userId).toBe('u1');
    });

    it('should delete the ticket even when IP binding rejects it', () => {
        store = new TicketStore({ ttlSeconds: 30, bindToIp: true });

        const result = store.issue({ userId: 'u1', ip: '10.0.0.1' });
        expect(store.size).toBe(1);

        // Rejected due to wrong IP, but ticket is still consumed (deleted)
        store.consume(result.ticket, '10.0.0.2');
        expect(store.size).toBe(0);
    });

    // ── Defaults ─────────────────────────────────────────────

    it('should use default TTL of 30 seconds', () => {
        store = new TicketStore();
        const result = store.issue({ userId: 'u1', ip: '127.0.0.1' });
        expect(result.expiresIn).toBe(30);
    });

    it('should enable IP binding by default', () => {
        store = new TicketStore();
        const result = store.issue({ userId: 'u1', ip: '10.0.0.1' });

        // Different IP should be rejected by default
        const payload = store.consume(result.ticket, '10.0.0.2');
        expect(payload).toBeNull();
    });

    // ── Destroy ──────────────────────────────────────────────

    it('should clear all tickets on destroy', () => {
        store = new TicketStore();
        store.issue({ userId: 'u1', ip: '127.0.0.1' });
        store.issue({ userId: 'u2', ip: '127.0.0.2' });
        expect(store.size).toBe(2);

        store.destroy();
        expect(store.size).toBe(0);
    });

    // ── Roles & Metadata Passthrough ─────────────────────────

    it('should handle ticket without roles or metadata', () => {
        store = new TicketStore({ bindToIp: false });
        const result = store.issue({ userId: 'u1', ip: '127.0.0.1' });
        const payload = store.consume(result.ticket, '127.0.0.1');

        expect(payload).not.toBeNull();
        expect(payload!.userId).toBe('u1');
        expect(payload!.roles).toBeUndefined();
        expect(payload!.metadata).toBeUndefined();
    });
});
