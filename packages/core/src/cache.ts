/**
 * @gao/core — Cache Service
 *
 * In-memory cache with TTL, namespacing, and invalidation.
 * Redis adapter interface for production use.
 * @Cached(ttl) decorator support.
 */

import type { CacheAdapter, CacheOptions } from './types.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | undefined; // undefined = no expiry
  namespace: string | undefined;
}

/**
 * In-memory cache adapter (default — no external dependencies).
 */
export class MemoryCacheAdapter implements CacheAdapter {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | undefined;

  constructor(cleanupIntervalMs = 60_000) {
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);

    // Don't prevent Node.js from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
      namespace: this.extractNamespace(key),
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async clear(namespace?: string): Promise<void> {
    if (!namespace) {
      this.store.clear();
      return;
    }

    for (const [key, entry] of this.store) {
      if (entry.namespace === namespace) {
        this.store.delete(key);
      }
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  get size(): number {
    return this.store.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== undefined && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  private extractNamespace(key: string): string | undefined {
    const colonIndex = key.indexOf(':');
    return colonIndex > 0 ? key.slice(0, colonIndex) : undefined;
  }
}

/**
 * Cache service with namespace support and decorator.
 */
export class CacheService {
  constructor(private readonly adapter: CacheAdapter = new MemoryCacheAdapter()) {}

  async get<T>(key: string, options?: CacheOptions): Promise<T | undefined> {
    const fullKey = this.buildKey(key, options?.namespace);
    return this.adapter.get<T>(fullKey);
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.namespace);
    await this.adapter.set(fullKey, value, options?.ttl);
  }

  /**
   * Get or set: return cached value, or compute and cache it.
   */
  async remember<T>(
    key: string,
    factory: () => T | Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const existing = await this.get<T>(key, options);
    if (existing !== undefined) return existing;

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.buildKey(key, options?.namespace);
    return this.adapter.delete(fullKey);
  }

  async invalidate(namespace: string): Promise<void> {
    await this.adapter.clear(namespace);
  }

  async clear(): Promise<void> {
    await this.adapter.clear();
  }

  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }
}

export function createCacheService(adapter?: CacheAdapter): CacheService {
  return new CacheService(adapter);
}
