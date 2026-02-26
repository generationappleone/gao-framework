import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueueManager } from '../src/queue-manager.js';
import type { QueueConfig } from '../src/types.js';

// Mock BullMQ Queue
vi.mock('bullmq', () => {
    const mockAdd = vi.fn().mockResolvedValue({ id: 'job-123' });
    const mockClose = vi.fn().mockResolvedValue(undefined);

    return {
        Queue: vi.fn().mockImplementation(() => ({
            add: mockAdd,
            close: mockClose,
        })),
    };
});

const createMockLogger = () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
});

const defaultConfig: QueueConfig = {
    enabled: true,
    redis: { host: 'localhost', port: 6379 },
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
};

describe('QueueManager', () => {
    let manager: QueueManager;
    let logger: ReturnType<typeof createMockLogger>;

    beforeEach(() => {
        vi.clearAllMocks();
        logger = createMockLogger();
        manager = new QueueManager(defaultConfig, logger as any);
    });

    it('should create a queue on first getQueue() call', () => {
        const queue = manager.getQueue('emails');
        expect(queue).toBeDefined();
        expect(logger.debug).toHaveBeenCalledWith('Queue created: emails');
    });

    it('should return the same queue instance on subsequent calls', () => {
        const first = manager.getQueue('emails');
        const second = manager.getQueue('emails');
        expect(first).toBe(second);
    });

    it('should track queue names', () => {
        manager.getQueue('emails');
        manager.getQueue('notifications');
        expect(manager.getQueueNames()).toEqual(['emails', 'notifications']);
    });

    it('should check queue existence with hasQueue()', () => {
        expect(manager.hasQueue('emails')).toBe(false);
        manager.getQueue('emails');
        expect(manager.hasQueue('emails')).toBe(true);
    });

    it('should add a job to a named queue', async () => {
        const jobId = await manager.addJob('emails', 'welcome', { userId: '123' });
        expect(jobId).toBe('job-123');
        expect(logger.debug).toHaveBeenCalledWith('Job added', {
            queue: 'emails',
            job: 'welcome',
            id: 'job-123',
        });
    });

    it('should add a job with custom options', async () => {
        await manager.addJob('emails', 'welcome', { userId: '123' }, {
            delay: 5000,
            attempts: 5,
            priority: 1,
        });
        expect(logger.debug).toHaveBeenCalledWith('Job added', expect.any(Object));
    });

    it('should add a job with repeat/cron options', async () => {
        await manager.addJob('cleanup', 'sessions', {}, {
            repeat: { pattern: '0 * * * *' },
        });
        expect(logger.debug).toHaveBeenCalled();
    });

    it('should return connection config', () => {
        const conn = manager.getConnection();
        expect(conn).toEqual({
            host: 'localhost',
            port: 6379,
            password: undefined,
            db: undefined,
        });
    });

    it('should shut down all queues gracefully', async () => {
        manager.getQueue('emails');
        manager.getQueue('notifications');

        await manager.shutdown();

        expect(manager.getQueueNames()).toEqual([]);
        expect(logger.info).toHaveBeenCalledWith('Queues shut down: emails, notifications');
    });

    it('should handle empty shutdown gracefully', async () => {
        await manager.shutdown();
        expect(logger.debug).toHaveBeenCalledWith('No queues to shut down.');
    });
});
