/**
 * @gao/queue — GaoWorker
 *
 * Wrapper around BullMQ Worker with GAO logging conventions.
 * Follows SRP: only handles worker lifecycle + event logging.
 */

import { Worker, Job } from 'bullmq';
import type { ConnectionOptions, WorkerOptions as BullWorkerOptions } from 'bullmq';
import type { Logger } from '@gao/core';
import type { WorkerOptions, JobResult } from './types.js';

/**
 * Processor function: receives job data, returns a result.
 */
export type ProcessorFn<TData = unknown, TResult = unknown> = (
    job: JobResult<TData>,
) => Promise<TResult> | TResult;

export class GaoWorker<TData = unknown, TResult = unknown> {
    private readonly worker: Worker<TData, TResult>;

    constructor(
        queueName: string,
        processor: ProcessorFn<TData, TResult>,
        connection: ConnectionOptions,
        logger: Logger,
        options?: WorkerOptions,
    ) {

        const bullOpts: BullWorkerOptions = {
            connection,
            concurrency: options?.concurrency ?? 5,
            autorun: options?.autorun ?? true,
        };

        if (options?.limiter) {
            bullOpts.limiter = {
                max: options.limiter.max,
                duration: options.limiter.duration,
            };
        }

        this.worker = new Worker<TData, TResult>(
            queueName,
            async (bullJob: Job<TData, TResult>) => {
                const jobResult: JobResult<TData> = {
                    id: bullJob.id ?? '',
                    name: bullJob.name,
                    data: bullJob.data,
                    attemptsMade: bullJob.attemptsMade,
                    timestamp: bullJob.timestamp,
                };
                return processor(jobResult);
            },
            bullOpts,
        );

        // ── Event logging ──
        this.worker.on('completed', (job: Job<TData, TResult>) => {
            logger.debug('Job completed', {
                queue: queueName,
                job: job.name,
                id: job.id,
            });
        });

        this.worker.on('failed', (job: Job<TData, TResult> | undefined, error: Error) => {
            logger.error('Job failed', {
                queue: queueName,
                job: job?.name ?? 'unknown',
                id: job?.id ?? 'unknown',
                error: error.message,
                attemptsMade: job?.attemptsMade ?? 0,
            });
        });

        this.worker.on('error', (error: Error) => {
            logger.error('Worker error', {
                queue: queueName,
                error: error.message,
            });
        });

        this.worker.on('stalled', (jobId: string) => {
            logger.warn('Job stalled', {
                queue: queueName,
                id: jobId,
            });
        });

        logger.info(`Worker started for queue: ${queueName}`, {
            concurrency: options?.concurrency ?? 5,
        });
    }

    /**
     * Pause the worker.
     */
    async pause(force = false): Promise<void> {
        await this.worker.pause(force);
    }

    /**
     * Resume the worker.
     */
    resume(): void {
        this.worker.resume();
    }

    /**
     * Check if the worker is running.
     */
    isRunning(): boolean {
        return this.worker.isRunning();
    }

    /**
     * Gracefully close the worker.
     */
    async close(force = false): Promise<void> {
        await this.worker.close(force);
    }
}

/**
 * Factory function.
 */
export function createWorker<TData = unknown, TResult = unknown>(
    queueName: string,
    processor: ProcessorFn<TData, TResult>,
    connection: ConnectionOptions,
    logger: Logger,
    options?: WorkerOptions,
): GaoWorker<TData, TResult> {
    return new GaoWorker(queueName, processor, connection, logger, options);
}
