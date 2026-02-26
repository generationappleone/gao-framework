/**
 * @gao/queue — QueueManager
 *
 * Central manager for creating and accessing named BullMQ queues.
 * Follows SRP: only manages queue lifecycle (create, get, close).
 * Follows OCP: new queue types are added by calling getQueue() with a name.
 */

import { Queue } from 'bullmq';
import type { ConnectionOptions, JobsOptions } from 'bullmq';
import type { Logger } from '@gao/core';
import type { QueueConfig, JobOptions } from './types.js';

export class QueueManager {
    private readonly queues = new Map<string, Queue>();
    private readonly connection: ConnectionOptions;
    private readonly defaultJobOpts: JobsOptions;

    constructor(
        config: QueueConfig,
        private readonly logger: Logger,
    ) {
        // Build ioredis-compatible connection options from our config
        this.connection = this.buildConnection(config);

        this.defaultJobOpts = {
            attempts: config.defaultJobOptions?.attempts ?? 3,
            backoff: {
                type: config.defaultJobOptions?.backoff?.type ?? 'exponential',
                delay: config.defaultJobOptions?.backoff?.delay ?? 1000,
            },
            removeOnComplete: config.defaultJobOptions?.removeOnComplete ?? 100,
            removeOnFail: config.defaultJobOptions?.removeOnFail ?? 500,
        };
    }

    /**
     * Build BullMQ-compatible connection options from our config.
     */
    private buildConnection(config: QueueConfig): ConnectionOptions {
        return {
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            db: config.redis.db,
        } as ConnectionOptions;
    }

    /**
     * Get or create a named queue. Queues are lazily created and cached.
     */
    getQueue(name: string): Queue {
        const existing = this.queues.get(name);
        if (existing) return existing;

        const queue = new Queue(name, {
            connection: this.connection,
            defaultJobOptions: this.defaultJobOpts,
        });

        this.queues.set(name, queue);
        this.logger.debug(`Queue created: ${name}`);
        return queue;
    }

    /**
     * Add a job to a named queue.
     * @returns The BullMQ job ID.
     */
    async addJob<T>(
        queueName: string,
        jobName: string,
        data: T,
        opts?: JobOptions,
    ): Promise<string> {
        const queue = this.getQueue(queueName);

        const bullOpts: JobsOptions = {};
        if (opts?.delay !== undefined) bullOpts.delay = opts.delay;
        if (opts?.attempts !== undefined) bullOpts.attempts = opts.attempts;
        if (opts?.priority !== undefined) bullOpts.priority = opts.priority;
        if (opts?.jobId !== undefined) bullOpts.jobId = opts.jobId;
        if (opts?.removeOnComplete !== undefined) bullOpts.removeOnComplete = opts.removeOnComplete;
        if (opts?.removeOnFail !== undefined) bullOpts.removeOnFail = opts.removeOnFail;
        if (opts?.backoff) {
            bullOpts.backoff = { type: opts.backoff.type, delay: opts.backoff.delay };
        }
        if (opts?.repeat) {
            bullOpts.repeat = {
                pattern: opts.repeat.pattern,
                every: opts.repeat.every,
                limit: opts.repeat.limit,
            };
        }

        const job = await queue.add(jobName, data, bullOpts);

        this.logger.debug('Job added', {
            queue: queueName,
            job: jobName,
            id: job.id,
        });

        return job.id ?? '';
    }

    /**
     * Get all registered queue names.
     */
    getQueueNames(): string[] {
        return [...this.queues.keys()];
    }

    /**
     * Check if a named queue is registered.
     */
    hasQueue(name: string): boolean {
        return this.queues.has(name);
    }

    /**
     * Get the Redis connection config (for workers that need the same connection).
     */
    getConnection(): ConnectionOptions {
        return this.connection;
    }

    /**
     * Gracefully close all queues.
     */
    async shutdown(): Promise<void> {
        const names = this.getQueueNames();

        if (names.length === 0) {
            this.logger.debug('No queues to shut down.');
            return;
        }

        const closePromises = [...this.queues.values()].map(async (queue) => {
            try {
                await queue.close();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to close queue: ${message}`);
            }
        });

        await Promise.all(closePromises);
        this.queues.clear();
        this.logger.info(`Queues shut down: ${names.join(', ')}`);
    }
}

/**
 * Factory function.
 */
export function createQueueManager(config: QueueConfig, logger: Logger): QueueManager {
    return new QueueManager(config, logger);
}
