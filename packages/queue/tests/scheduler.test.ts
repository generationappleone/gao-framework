import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Scheduler } from '../src/scheduler.js';
import type { QueueManager } from '../src/queue-manager.js';

const createMockLogger = () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
});

const createMockQueueManager = () => ({
    addJob: vi.fn().mockResolvedValue('job-cron-1'),
    getQueue: vi.fn(),
    getQueueNames: vi.fn().mockReturnValue([]),
    hasQueue: vi.fn().mockReturnValue(false),
    getConnection: vi.fn().mockReturnValue({}),
    shutdown: vi.fn().mockResolvedValue(undefined),
});

describe('Scheduler', () => {
    let scheduler: Scheduler;
    let mockManager: ReturnType<typeof createMockQueueManager>;
    let logger: ReturnType<typeof createMockLogger>;

    beforeEach(() => {
        vi.clearAllMocks();
        logger = createMockLogger();
        mockManager = createMockQueueManager();
        scheduler = new Scheduler(mockManager as unknown as QueueManager, logger as any);
    });

    it('should register a cron job with pattern', async () => {
        const jobId = await scheduler.registerCron('email', 'daily-digest', {
            pattern: '0 8 * * *',
        }, { type: 'digest' });

        expect(jobId).toBe('job-cron-1');
        expect(mockManager.addJob).toHaveBeenCalledWith('email', 'daily-digest', { type: 'digest' }, {
            repeat: { pattern: '0 8 * * *' },
        });
        expect(logger.info).toHaveBeenCalledWith(
            'Cron job registered: email/daily-digest (0 8 * * *)',
        );
    });

    it('should register a cron job with interval', async () => {
        await scheduler.registerCron('cleanup', 'sessions', { every: 300000 }, {});

        expect(logger.info).toHaveBeenCalledWith(
            'Cron job registered: cleanup/sessions (every 300000ms)',
        );
    });

    it('should track scheduled jobs', async () => {
        await scheduler.registerCron('q1', 'j1', { pattern: '* * * * *' }, {});
        await scheduler.registerCron('q2', 'j2', { every: 5000 }, {});

        const jobs = scheduler.getScheduledJobs();
        expect(jobs).toHaveLength(2);
        expect(jobs[0]).toEqual({
            queueName: 'q1',
            jobName: 'j1',
            pattern: '* * * * *',
            every: undefined,
        });
        expect(jobs[1]).toEqual({
            queueName: 'q2',
            jobName: 'j2',
            pattern: undefined,
            every: 5000,
        });
    });

    it('should report count', async () => {
        expect(scheduler.count).toBe(0);
        await scheduler.registerCron('q', 'j', { pattern: '0 0 * * *' }, {});
        expect(scheduler.count).toBe(1);
    });
});
