/**
 * @gao/http — Redis Session Store
 *
 * Redis-backed session store implementing SessionStore interface.
 * Uses ioredis (optional peer dependency) for persistence.
 */

import type { SessionStore } from './session.js';
import type { RedisLikeClient } from '@gao/core';

export interface RedisSessionStoreOptions {
    /** Key prefix. Default: 'gao:session:' */
    prefix?: string;
}

/**
 * Redis-backed session store for production use.
 *
 * Usage:
 * ```ts
 * import { createRedisClient } from '@gao/core';
 * import { RedisSessionStore, sessionMiddleware } from '@gao/http';
 *
 * const redis = await createRedisClient({ host: '127.0.0.1' });
 * const store = new RedisSessionStore(redis);
 *
 * app.use(sessionMiddleware({ store }));
 * ```
 */
export class RedisSessionStore implements SessionStore {
    private readonly prefix: string;

    constructor(
        private readonly client: RedisLikeClient,
        options?: RedisSessionStoreOptions,
    ) {
        this.prefix = options?.prefix ?? 'gao:session:';
    }

    private prefixKey(id: string): string {
        return `${this.prefix}${id}`;
    }

    async get(id: string): Promise<Record<string, unknown> | null> {
        const data = await this.client.get(this.prefixKey(id));
        if (data === null) return null;

        try {
            return JSON.parse(data) as Record<string, unknown>;
        } catch {
            return null;
        }
    }

    async set(id: string, data: Record<string, unknown>, ttlSeconds: number): Promise<void> {
        const serialized = JSON.stringify(data);
        await this.client.set(this.prefixKey(id), serialized, 'EX', ttlSeconds);
    }

    async destroy(id: string): Promise<void> {
        await this.client.del(this.prefixKey(id));
    }

    async touch(id: string, ttlSeconds: number): Promise<void> {
        await this.client.expire(this.prefixKey(id), ttlSeconds);
    }
}
