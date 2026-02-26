/**
 * @gao/queue — Scheduler
 *
 * Manages repeatable/cron-based jobs.
 * Follows SRP: only handles repeatable job registration and listing.
 */

import type { Logger } from '@gao/core';
import type { QueueManager } from './queue-manager.js';
import type { JobOptions, RepeatOptions } from './types.js';

export interface ScheduledJob {
    readonly queueName: string;
    readonly jobName: string;
    readonly pattern?: string;
    readonly every?: number;
}

export class Scheduler {
    private readonly scheduled: ScheduledJob[] = [];

    constructor(
        private readonly queueManager: QueueManager,
        private readonly logger: Logger,
    ) { }

    /**
     * Register a repeatable cron job.
     *
     * @param queueName - Target queue name
     * @param jobName - Job name within the queue
     * @param repeat - Cron pattern or interval
     * @param data - Job payload
     *
     * @example
     * ```ts
     * scheduler.registerCron('email', 'daily-digest', { pattern: '0 8 * * *' }, {});
     * scheduler.registerCron('cleanup', 'expired-sessions', { every: 300000 }, {});
     * ```
     */
    async registerCron<T>(
        queueName: string,
        jobName: string,
        repeat: RepeatOptions,
        data: T,
    ): Promise<string> {
        const opts: JobOptions = { repeat };

        const jobId = await this.queueManager.addJob(queueName, jobName, data, opts);

        this.scheduled.push({
            queueName,
            jobName,
            pattern: repeat.pattern,
            every: repeat.every,
        });

        const schedule = repeat.pattern ?? `every ${repeat.every}ms`;
        this.logger.info(`Cron job registered: ${queueName}/${jobName} (${schedule})`);

        return jobId;
    }

    /**
     * Get all registered scheduled jobs.
     */
    getScheduledJobs(): readonly ScheduledJob[] {
        return [...this.scheduled];
    }

    /**
     * Get count of registered scheduled jobs.
     */
    get count(): number {
        return this.scheduled.length;
    }
}

/**
 * Factory function.
 */
export function createScheduler(queueManager: QueueManager, logger: Logger): Scheduler {
    return new Scheduler(queueManager, logger);
}
