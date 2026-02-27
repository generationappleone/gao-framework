/**
 * @gao/core — Redis Adapter Tests (Mocked)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisCacheAdapter, type RedisLikeClient } from '../src/redis.js';

function createMockRedis(): RedisLikeClient & { _store: Map<string, { value: string; ttl?: number }> } {
    const store = new Map<string, { value: string; ttl?: number }>();

    return {
        _store: store,
        async get(key: string) {
            const entry = store.get(key);
            return entry ? entry.value : null;
        },
        async set(key: string, value: string, ...args: any[]) {
            const ttl = args[0] === 'EX' ? args[1] : undefined;
            store.set(key, { value, ttl });
            return 'OK';
        },
        async del(...keys: string[]) {
            let count = 0;
            for (const key of keys) {
                if (store.delete(key)) count++;
            }
            return count;
        },
        async exists(...keys: string[]) {
            let count = 0;
            for (const key of keys) {
                if (store.has(key)) count++;
            }
            return count;
        },
        async expire(_key: string, _seconds: number) {
            return 1;
        },
        async keys(pattern: string) {
            const prefix = pattern.replace('*', '');
            return Array.from(store.keys()).filter(k => k.startsWith(prefix));
        },
        async quit() {
            store.clear();
            return 'OK';
        },
    };
}

describe('RedisCacheAdapter', () => {
    let redis: ReturnType<typeof createMockRedis>;
    let adapter: RedisCacheAdapter;

    beforeEach(() => {
        redis = createMockRedis();
        adapter = new RedisCacheAdapter(redis);
    });

    it('sets and gets a value', async () => {
        await adapter.set('user:1', { name: 'Alice' });
        const result = await adapter.get<{ name: string }>('user:1');
        expect(result).toEqual({ name: 'Alice' });
    });

    it('returns undefined for missing keys', async () => {
        const result = await adapter.get('nonexistent');
        expect(result).toBeUndefined();
    });

    it('stores with TTL when provided', async () => {
        await adapter.set('temp', 'value', 300);
        const entry = redis._store.get('gao:cache:temp');
        expect(entry?.ttl).toBe(300);
    });

    it('stores without TTL when not provided', async () => {
        await adapter.set('permanent', 'value');
        const entry = redis._store.get('gao:cache:permanent');
        expect(entry?.ttl).toBeUndefined();
    });

    it('deletes a key', async () => {
        await adapter.set('key', 'value');
        expect(await adapter.has('key')).toBe(true);

        const deleted = await adapter.delete('key');
        expect(deleted).toBe(true);
        expect(await adapter.has('key')).toBe(false);
    });

    it('returns false when deleting non-existent key', async () => {
        const deleted = await adapter.delete('missing');
        expect(deleted).toBe(false);
    });

    it('checks key existence with has()', async () => {
        expect(await adapter.has('key')).toBe(false);
        await adapter.set('key', 'val');
        expect(await adapter.has('key')).toBe(true);
    });

    it('clears all keys with matching prefix', async () => {
        await adapter.set('a', 1);
        await adapter.set('b', 2);
        await adapter.set('c', 3);

        await adapter.clear();

        expect(await adapter.has('a')).toBe(false);
        expect(await adapter.has('b')).toBe(false);
        expect(await adapter.has('c')).toBe(false);
    });

    it('clears by namespace', async () => {
        await adapter.set('users:1', 'a');
        await adapter.set('users:2', 'b');
        await adapter.set('posts:1', 'c');

        await adapter.clear('users');

        expect(await adapter.has('users:1')).toBe(false);
        expect(await adapter.has('users:2')).toBe(false);
        expect(await adapter.has('posts:1')).toBe(true);
    });

    it('uses custom prefix', async () => {
        const customAdapter = new RedisCacheAdapter(redis, { prefix: 'myapp:' });
        await customAdapter.set('key', 'val');

        expect(redis._store.has('myapp:key')).toBe(true);
        expect(redis._store.has('gao:cache:key')).toBe(false);
    });

    it('handles JSON objects correctly', async () => {
        const data = { users: [{ id: 1, name: 'Alice' }], total: 1 };
        await adapter.set('complex', data);
        const result = await adapter.get('complex');
        expect(result).toEqual(data);
    });

    it('destroy() disconnects the client', async () => {
        const quitSpy = vi.spyOn(redis, 'quit');
        await adapter.destroy();
        expect(quitSpy).toHaveBeenCalled();
    });
});
