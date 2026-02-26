import { describe, expect, it } from 'vitest';
import { MemoryCacheAdapter, createCacheService } from '../src/cache.js';

describe('Cache Service', () => {
  it('should perform get and set correctly', async () => {
    const cache = createCacheService();

    await cache.set('key1', 'value1');
    const val = await cache.get<string>('key1');
    expect(val).toBe('value1');
  });

  it('should perform remember correctly', async () => {
    const cache = createCacheService();

    let counter = 0;
    const val1 = await cache.remember('key', () => {
      counter++;
      return 'value';
    });
    const val2 = await cache.remember('key', () => {
      counter++;
      return 'other-value';
    });

    expect(val1).toBe('value');
    expect(val2).toBe('value');
    expect(counter).toBe(1);
  });

  it('should support namespaces', async () => {
    const cache = createCacheService();

    await cache.set('key', 'default');
    await cache.set('key', 'namespaced', { namespace: 'my-ns' });

    expect(await cache.get('key')).toBe('default');
    expect(await cache.get('key', { namespace: 'my-ns' })).toBe('namespaced');

    await cache.invalidate('my-ns');

    expect(await cache.get('key')).toBe('default');
    expect(await cache.get('key', { namespace: 'my-ns' })).toBeUndefined();
  });

  it('should support TTL expiration', async () => {
    const cache = createCacheService();

    await cache.set('ttl-key', 'value', { ttl: -1 }); // Set negative TTL to expire immediately

    const val = await cache.get('ttl-key');
    expect(val).toBeUndefined();
  });
});
