/**
 * @gao/crypto-transport — Redis Session Store
 *
 * Production-ready session store using Redis for E2EE sessions.
 * Supports multi-process deployments and automatic TTL-based expiration
 * via Redis EXPIRE.
 *
 * Requires a Redis-compatible client (ioredis, @upstash/redis, etc.)
 * that implements the RedisClient interface.
 */

import type { E2EESession, SessionStore } from '../types.js';

/**
 * Minimal Redis client interface — compatible with ioredis and node-redis.
 */
export interface RedisClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
    del(key: string | string[]): Promise<unknown>;
    expire(key: string, seconds: number): Promise<unknown>;
    incr(key: string): Promise<number>;
}

const KEY_PREFIX = 'gao:e2ee:session:';
const COUNTER_PREFIX = 'gao:e2ee:counter:';

/**
 * Serialize a session for Redis storage.
 * Buffer fields are stored as base64 strings.
 */
function serializeSession(session: E2EESession): string {
    return JSON.stringify({
        sessionId: session.sessionId,
        encryptionKey: session.encryptionKey.toString('base64'),
        macKey: session.macKey.toString('base64'),
        createdAt: session.createdAt,
        requestCount: session.requestCount,
        lastRotatedAt: session.lastRotatedAt,
        lastSeq: session.lastSeq,
        clientPublicKey: session.clientPublicKey.toString('base64'),
        serverPublicKey: session.serverPublicKey.toString('base64'),
        serverPrivateKey: session.serverPrivateKey.toString('base64'),
    });
}

/**
 * Deserialize a session from Redis storage.
 */
function deserializeSession(raw: string): E2EESession {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
        sessionId: data['sessionId'] as string,
        encryptionKey: Buffer.from(data['encryptionKey'] as string, 'base64'),
        macKey: Buffer.from(data['macKey'] as string, 'base64'),
        createdAt: data['createdAt'] as number,
        requestCount: data['requestCount'] as number,
        lastRotatedAt: data['lastRotatedAt'] as number,
        lastSeq: (data['lastSeq'] as number) ?? 0,
        clientPublicKey: Buffer.from(data['clientPublicKey'] as string, 'base64'),
        serverPublicKey: Buffer.from(data['serverPublicKey'] as string, 'base64'),
        serverPrivateKey: Buffer.from(data['serverPrivateKey'] as string, 'base64'),
    };
}

export class RedisSessionStore implements SessionStore {
    private readonly ttlSeconds: number;

    constructor(
        private readonly redis: RedisClient,
        options?: { ttlMs?: number },
    ) {
        this.ttlSeconds = Math.floor((options?.ttlMs ?? 86_400_000) / 1000);
    }

    async get(sessionId: string): Promise<E2EESession | null> {
        const raw = await this.redis.get(`${KEY_PREFIX}${sessionId}`);
        if (!raw) return null;

        const session = deserializeSession(raw);

        // Sync requestCount from the atomic counter key
        const counterRaw = await this.redis.get(`${COUNTER_PREFIX}${sessionId}`);
        if (counterRaw !== null) {
            session.requestCount = parseInt(counterRaw, 10);
        }

        return session;
    }

    async set(session: E2EESession): Promise<void> {
        const key = `${KEY_PREFIX}${session.sessionId}`;
        // Combine SET + EXPIRE in single call: SET key val EX ttl
        await this.redis.set(key, serializeSession(session), 'EX', this.ttlSeconds);

        // Initialize the atomic counter key
        const counterKey = `${COUNTER_PREFIX}${session.sessionId}`;
        await this.redis.set(counterKey, String(session.requestCount), 'EX', this.ttlSeconds);
    }

    async delete(sessionId: string): Promise<void> {
        await this.redis.del(`${KEY_PREFIX}${sessionId}`);
        await this.redis.del(`${COUNTER_PREFIX}${sessionId}`);
    }

    /**
     * Atomically increment the request counter using Redis INCR.
     * INCR is a single-command atomic operation — no read-modify-write race.
     */
    async incrementRequestCount(sessionId: string): Promise<number> {
        const counterKey = `${COUNTER_PREFIX}${sessionId}`;
        const newCount = await this.redis.incr(counterKey);

        // If the counter key didn't exist (session was set before this fix),
        // verify the session itself exists
        if (newCount === 1) {
            const exists = await this.redis.get(`${KEY_PREFIX}${sessionId}`);
            if (!exists) {
                await this.redis.del(counterKey);
                throw new Error('Session not found');
            }
        }

        return newCount;
    }
}
