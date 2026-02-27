import { describe, it, expect, afterEach } from 'vitest';
import { SlidingWindowLimiter } from '../src/sliding-window.js';

describe('SlidingWindowLimiter', () => {
    let limiter: SlidingWindowLimiter;

    afterEach(() => {
        limiter?.destroy();
    });

    it('should allow requests within limit', () => {
        limiter = new SlidingWindowLimiter(60_000, 0);
        const result = limiter.check('user:1', 5);
        expect(result.allowed).toBe(true);
        expect(result.count).toBe(1);
        expect(result.remaining).toBe(4);
    });

    it('should deny requests exceeding limit', () => {
        limiter = new SlidingWindowLimiter(60_000, 0);
        const key = 'user:2';

        // Use all 3 allowed requests
        limiter.check(key, 3);
        limiter.check(key, 3);
        limiter.check(key, 3);

        // 4th should be denied
        const result = limiter.check(key, 3);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it('should track separate keys independently', () => {
        limiter = new SlidingWindowLimiter(60_000, 0);

        limiter.check('a', 2);
        limiter.check('a', 2);

        // 'a' is exhausted, but 'b' is independent
        const resultA = limiter.check('a', 2);
        const resultB = limiter.check('b', 2);

        expect(resultA.allowed).toBe(false);
        expect(resultB.allowed).toBe(true);
    });

    it('should expire old entries after window passes', async () => {
        limiter = new SlidingWindowLimiter(50, 0); // 50ms window

        limiter.check('key', 2);
        limiter.check('key', 2);
        expect(limiter.check('key', 2).allowed).toBe(false);

        // Wait for window to expire
        await new Promise((r) => setTimeout(r, 60));

        // Should be allowed again
        const result = limiter.check('key', 2);
        expect(result.allowed).toBe(true);
        expect(result.count).toBe(1);
    });

    it('should report resetMs correctly', () => {
        limiter = new SlidingWindowLimiter(60_000, 0);
        const result = limiter.check('key', 10);
        expect(result.resetMs).toBeGreaterThan(0);
        expect(result.resetMs).toBeLessThanOrEqual(60_000);
    });

    it('should reset a specific key', () => {
        limiter = new SlidingWindowLimiter(60_000, 0);
        limiter.check('key', 1);
        expect(limiter.check('key', 1).allowed).toBe(false);

        limiter.reset('key');
        expect(limiter.check('key', 1).allowed).toBe(true);
    });

    it('should clear all keys', () => {
        limiter = new SlidingWindowLimiter(60_000, 0);
        limiter.check('a', 1);
        limiter.check('b', 1);
        expect(limiter.size).toBe(2);

        limiter.clear();
        expect(limiter.size).toBe(0);
    });

    it('should handle count correctly at boundary', () => {
        limiter = new SlidingWindowLimiter(60_000, 0);
        const key = 'boundary';

        // Exactly at limit
        const r1 = limiter.check(key, 1);
        expect(r1.allowed).toBe(true);
        expect(r1.count).toBe(1);
        expect(r1.remaining).toBe(0);

        // One over
        const r2 = limiter.check(key, 1);
        expect(r2.allowed).toBe(false);
        expect(r2.count).toBe(1);
        expect(r2.remaining).toBe(0);
    });
});
