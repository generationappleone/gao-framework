/**
 * @gao/core — Sliding Window Rate Limiter
 *
 * More accurate than fixed-window: prevents edge-of-window burst attacks.
 * Each key has its own window of timestamps.
 * Periodic cleanup prevents unbounded memory growth.
 */

export interface SlidingWindowResult {
    /** Whether the request is allowed. */
    allowed: boolean;
    /** Current count of requests in the window (after this request). */
    count: number;
    /** Remaining allowed requests in the window. */
    remaining: number;
    /** Milliseconds until the oldest entry expires (window resets). */
    resetMs: number;
}

export class SlidingWindowLimiter {
    private readonly windows = new Map<string, number[]>();
    private cleanupTimer: ReturnType<typeof setInterval> | undefined;

    /**
     * @param windowMs - Sliding window duration in milliseconds. Default: 60000 (1 minute).
     * @param cleanupIntervalMs - How often to run expired entry cleanup. Default: 30000 (30s).
     */
    constructor(
        private readonly windowMs: number = 60_000,
        cleanupIntervalMs = 30_000,
    ) {
        if (cleanupIntervalMs > 0) {
            this.cleanupTimer = setInterval(() => this.cleanup(), cleanupIntervalMs);
            if (this.cleanupTimer.unref) this.cleanupTimer.unref();
        }
    }

    /**
     * Check if a request for `key` is allowed under the rate limit.
     * If allowed, the request is recorded in the window.
     */
    check(key: string, maxRequests: number): SlidingWindowResult {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        let timestamps = this.windows.get(key);
        if (!timestamps) {
            timestamps = [];
            this.windows.set(key, timestamps);
        }

        // Purge expired timestamps (before window start)
        let validIdx = 0;
        while (validIdx < timestamps.length && timestamps[validIdx]! <= windowStart) {
            validIdx++;
        }
        if (validIdx > 0) {
            timestamps.splice(0, validIdx);
        }

        const count = timestamps.length;
        const allowed = count < maxRequests;

        if (allowed) {
            timestamps.push(now);
        }

        const resetMs =
            timestamps.length > 0
                ? Math.max(0, timestamps[0]! + this.windowMs - now)
                : this.windowMs;

        return {
            allowed,
            count: allowed ? count + 1 : count,
            remaining: Math.max(0, maxRequests - count - (allowed ? 1 : 0)),
            resetMs,
        };
    }

    /** Reset the window for a specific key. */
    reset(key: string): void {
        this.windows.delete(key);
    }

    /** Remove all windows. */
    clear(): void {
        this.windows.clear();
    }

    /** Get the number of tracked keys. */
    get size(): number {
        return this.windows.size;
    }

    /** Stop background cleanup and release resources. */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.windows.clear();
    }

    private cleanup(): void {
        const windowStart = Date.now() - this.windowMs;
        for (const [key, timestamps] of this.windows) {
            // Remove expired leading entries
            let validIdx = 0;
            while (validIdx < timestamps.length && timestamps[validIdx]! <= windowStart) {
                validIdx++;
            }
            if (validIdx === timestamps.length) {
                this.windows.delete(key); // All expired — remove key
            } else if (validIdx > 0) {
                timestamps.splice(0, validIdx);
            }
        }
    }
}
