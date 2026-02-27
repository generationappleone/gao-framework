/**
 * @gao/core — LRU Cache Adapter
 *
 * Memory-bounded cache with Least Recently Used eviction policy.
 * Tracks approximate byte size of stored entries, evicting the
 * least-recently-used entries when the budget is exceeded.
 *
 * Uses Map insertion-order semantics for O(1) LRU refresh.
 */

import type { CacheAdapter } from './types.js';

export interface LRUCacheOptions {
    /** Maximum total memory budget in bytes. Default: 50 MB. */
    maxBytes?: number;
    /** Default TTL in seconds for entries. 0 = no expiry. Default: 0. */
    defaultTtl?: number;
}

interface LRUEntry<T = unknown> {
    value: T;
    sizeBytes: number;
    expiresAt: number | undefined;
}

export class LRUCacheAdapter implements CacheAdapter {
    private readonly store = new Map<string, LRUEntry>();
    private currentBytes = 0;
    private readonly maxBytes: number;
    private readonly defaultTtl: number;
    private cleanupTimer: ReturnType<typeof setInterval> | undefined;

    private _hitCount = 0;
    private _missCount = 0;
    private _evictionCount = 0;

    constructor(options: LRUCacheOptions = {}) {
        this.maxBytes = options.maxBytes ?? 50 * 1024 * 1024; // 50 MB
        this.defaultTtl = options.defaultTtl ?? 0;

        // Periodic expired entry cleanup
        this.cleanupTimer = setInterval(() => this.cleanupExpired(), 60_000);
        if (this.cleanupTimer.unref) this.cleanupTimer.unref();
    }

    async get<T>(key: string): Promise<T | undefined> {
        const entry = this.store.get(key);
        if (!entry) {
            this._missCount++;
            return undefined;
        }

        // Check TTL
        if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
            this.deleteEntry(key, entry);
            this._missCount++;
            return undefined;
        }

        // LRU refresh: delete and re-insert to move to end (most recent)
        this.store.delete(key);
        this.store.set(key, entry);
        this._hitCount++;

        return entry.value as T;
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const serialized = JSON.stringify(value);
        const sizeBytes = serialized.length * 2; // Rough UTF-16 estimate

        // Remove old entry if exists
        const existing = this.store.get(key);
        if (existing) {
            this.currentBytes -= existing.sizeBytes;
            this.store.delete(key);
        }

        // Evict LRU entries until under budget
        while (this.currentBytes + sizeBytes > this.maxBytes && this.store.size > 0) {
            const oldestKey = this.store.keys().next().value!;
            const oldestEntry = this.store.get(oldestKey)!;
            this.deleteEntry(oldestKey, oldestEntry);
            this._evictionCount++;
        }

        const effectiveTtl = ttl ?? this.defaultTtl;
        const expiresAt = effectiveTtl > 0 ? Date.now() + effectiveTtl * 1000 : undefined;

        this.store.set(key, { value, sizeBytes, expiresAt });
        this.currentBytes += sizeBytes;
    }

    async delete(key: string): Promise<boolean> {
        const entry = this.store.get(key);
        if (!entry) return false;
        this.deleteEntry(key, entry);
        return true;
    }

    async clear(namespace?: string): Promise<void> {
        if (!namespace) {
            this.store.clear();
            this.currentBytes = 0;
            return;
        }

        const prefix = `${namespace}:`;
        for (const [key, entry] of this.store) {
            if (key.startsWith(prefix)) {
                this.deleteEntry(key, entry);
            }
        }
    }

    async has(key: string): Promise<boolean> {
        const entry = this.store.get(key);
        if (!entry) return false;
        if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
            this.deleteEntry(key, entry);
            return false;
        }
        return true;
    }

    /** Number of entries in the cache. */
    get size(): number {
        return this.store.size;
    }

    /** Approximate bytes used by cached entries. */
    get usedBytes(): number {
        return this.currentBytes;
    }

    /** Maximum byte budget. */
    get budgetBytes(): number {
        return this.maxBytes;
    }

    /** Cache hit count. */
    get hitCount(): number {
        return this._hitCount;
    }

    /** Cache miss count. */
    get missCount(): number {
        return this._missCount;
    }

    /** Number of evictions performed. */
    get evictionCount(): number {
        return this._evictionCount;
    }

    /** Hit ratio: 1.0 = all hits, 0.0 = all misses. */
    get hitRatio(): number {
        const total = this._hitCount + this._missCount;
        if (total === 0) return 0;
        return this._hitCount / total;
    }

    /** Stop cleanup timer and release resources. */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.store.clear();
        this.currentBytes = 0;
    }

    private deleteEntry(key: string, entry: LRUEntry): void {
        this.currentBytes -= entry.sizeBytes;
        this.store.delete(key);
    }

    private cleanupExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (entry.expiresAt !== undefined && now > entry.expiresAt) {
                this.deleteEntry(key, entry);
            }
        }
    }
}
