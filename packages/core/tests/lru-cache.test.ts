import { describe, it, expect, afterEach } from 'vitest';
import { LRUCacheAdapter } from '../src/lru-cache.js';

describe('LRUCacheAdapter', () => {
    let cache: LRUCacheAdapter;

    afterEach(() => {
        cache?.destroy();
    });

    it('should store and retrieve values', async () => {
        cache = new LRUCacheAdapter();
        await cache.set('key1', { name: 'test' });
        const value = await cache.get<{ name: string }>('key1');
        expect(value).toEqual({ name: 'test' });
    });

    it('should return undefined for missing keys', async () => {
        cache = new LRUCacheAdapter();
        const value = await cache.get('nonexistent');
        expect(value).toBeUndefined();
    });

    it('should evict LRU entry when maxBytes exceeded', async () => {
        // Budget of 40 bytes. Each JSON-serialized "hello-a" = 9 chars × 2 = 18 bytes.
        // So 2 entries fit (36 bytes), but a 3rd (54 bytes) forces eviction.
        cache = new LRUCacheAdapter({ maxBytes: 40 });

        await cache.set('a', 'hello-a'); // 18 bytes → total 18
        await cache.set('b', 'hello-b'); // 18 bytes → total 36

        // Adding 'c' pushes to 54, exceeds 40 → must evict 'a' (LRU)
        await cache.set('c', 'hello-c');

        const a = await cache.get('a');
        expect(a).toBeUndefined();
        expect(cache.evictionCount).toBeGreaterThan(0);
    });

    it('should refresh LRU position on get', async () => {
        // Each entry ≈ 14 bytes. Budget of 30 fits 2 entries (28 bytes).
        cache = new LRUCacheAdapter({ maxBytes: 30 });

        await cache.set('a', 'val-a'); // 14 bytes
        await cache.set('b', 'val-b'); // 14 bytes → total 28

        // Access 'a' to refresh its LRU position (moves after 'b')
        await cache.get('a');

        // Adding 'c' (14 bytes) → total would be 42, exceeds 30
        // 'b' is now the LRU (oldest unreferenced), so 'b' gets evicted
        await cache.set('c', 'val-c');

        const a = await cache.get('a');
        const b = await cache.get('b');
        expect(a).toBeDefined();
        expect(b).toBeUndefined();
    });

    it('should expire entries based on TTL', async () => {
        cache = new LRUCacheAdapter();
        await cache.set('ttl-key', 'value', 0.05); // 50ms TTL

        const before = await cache.get('ttl-key');
        expect(before).toBe('value');

        // Wait for expiry
        await new Promise((r) => setTimeout(r, 60));

        const after = await cache.get('ttl-key');
        expect(after).toBeUndefined();
    });

    it('should delete entries', async () => {
        cache = new LRUCacheAdapter();
        await cache.set('del-key', 'value');
        const deleted = await cache.delete('del-key');
        expect(deleted).toBe(true);
        expect(await cache.has('del-key')).toBe(false);

        const notDeleted = await cache.delete('nonexistent');
        expect(notDeleted).toBe(false);
    });

    it('should clear all entries', async () => {
        cache = new LRUCacheAdapter();
        await cache.set('k1', 'v1');
        await cache.set('k2', 'v2');
        await cache.clear();
        expect(cache.size).toBe(0);
        expect(cache.usedBytes).toBe(0);
    });

    it('should clear entries by namespace prefix', async () => {
        cache = new LRUCacheAdapter();
        await cache.set('users:1', 'alice');
        await cache.set('users:2', 'bob');
        await cache.set('items:1', 'widget');

        await cache.clear('users');

        expect(await cache.has('users:1')).toBe(false);
        expect(await cache.has('users:2')).toBe(false);
        expect(await cache.has('items:1')).toBe(true);
    });

    it('should track hit and miss counts', async () => {
        cache = new LRUCacheAdapter();
        await cache.set('key', 'value');

        await cache.get('key'); // hit
        await cache.get('key'); // hit
        await cache.get('missing'); // miss

        expect(cache.hitCount).toBe(2);
        expect(cache.missCount).toBe(1);
        expect(cache.hitRatio).toBeCloseTo(2 / 3);
    });

    it('should report hitRatio 0 when no operations', () => {
        cache = new LRUCacheAdapter();
        expect(cache.hitRatio).toBe(0);
    });

    it('should overwrite existing key and update size', async () => {
        cache = new LRUCacheAdapter();
        await cache.set('k', 'short');
        const sizeBefore = cache.usedBytes;

        await cache.set('k', 'a-much-longer-string-here');
        const sizeAfter = cache.usedBytes;

        expect(sizeAfter).toBeGreaterThan(sizeBefore);
        expect(cache.size).toBe(1);
        expect(await cache.get('k')).toBe('a-much-longer-string-here');
    });
});
