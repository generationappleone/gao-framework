/**
 * @gao/core — Redis Cache Adapter & Client Factory
 *
 * Implements CacheAdapter using ioredis (optional peer dependency).
 * All keys are prefixed with a configurable namespace to avoid collisions.
 */

import type { CacheAdapter } from './types.js';

export interface RedisClientConfig {
    /** Full Redis URL, e.g. 'redis://user:pass@host:6379/0' */
    url?: string;
    /** Redis host. Default: '127.0.0.1' */
    host?: string;
    /** Redis port. Default: 6379 */
    port?: number;
    /** Redis password */
    password?: string;
    /** Redis database number. Default: 0 */
    db?: number;
    /** Key prefix. Default: 'gao:' */
    keyPrefix?: string;
}

/**
 * Generic interface matching ioredis Redis client methods we use.
 * This avoids requiring ioredis as a direct dependency.
 */
export interface RedisLikeClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ...args: any[]): Promise<string | null>;
    del(...keys: string[]): Promise<number>;
    exists(...keys: string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    quit(): Promise<string>;
}

/**
 * Redis-backed cache adapter implementing CacheAdapter.
 */
export class RedisCacheAdapter implements CacheAdapter {
    private readonly prefix: string;

    constructor(
        private readonly client: RedisLikeClient,
        options?: { prefix?: string },
    ) {
        this.prefix = options?.prefix ?? 'gao:cache:';
    }

    private prefixKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    async get<T>(key: string): Promise<T | undefined> {
        const data = await this.client.get(this.prefixKey(key));
        if (data === null) return undefined;

        try {
            return JSON.parse(data) as T;
        } catch {
            return data as unknown as T;
        }
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const serialized = JSON.stringify(value);
        const prefixed = this.prefixKey(key);

        if (ttl && ttl > 0) {
            await this.client.set(prefixed, serialized, 'EX', ttl);
        } else {
            await this.client.set(prefixed, serialized);
        }
    }

    async delete(key: string): Promise<boolean> {
        const result = await this.client.del(this.prefixKey(key));
        return result > 0;
    }

    async has(key: string): Promise<boolean> {
        const result = await this.client.exists(this.prefixKey(key));
        return result > 0;
    }

    async clear(namespace?: string): Promise<void> {
        const pattern = namespace
            ? `${this.prefix}${namespace}:*`
            : `${this.prefix}*`;

        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
    }

    /**
     * Disconnect the Redis client.
     */
    async destroy(): Promise<void> {
        await this.client.quit();
    }
}

/**
 * Create a Redis client using ioredis.
 * Requires `ioredis` to be installed as a peer dependency.
 *
 * @throws Error if ioredis is not installed
 */
export async function createRedisClient(config: RedisClientConfig = {}): Promise<RedisLikeClient> {
    let Redis: any;
    try {
        // @ts-ignore — ioredis is an optional peer dependency
        const mod = await import('ioredis');
        Redis = mod.default || mod;
    } catch {
        throw new Error(
            'ioredis is required for Redis support. Install it: pnpm add ioredis'
        );
    }

    if (config.url) {
        return new Redis(config.url);
    }

    return new Redis({
        host: config.host ?? '127.0.0.1',
        port: config.port ?? 6379,
        password: config.password,
        db: config.db ?? 0,
        keyPrefix: config.keyPrefix,
    });
}
