import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GaoWorker } from '../src/worker.js';
import type { ConnectionOptions } from 'bullmq';
import type { JobResult } from '../src/types.js';

// Mock BullMQ Worker
const mockWorkerOn = vi.fn();
const mockWorkerPause = vi.fn().mockResolvedValue(undefined);
const mockWorkerResume = vi.fn();
const mockWorkerClose = vi.fn().mockResolvedValue(undefined);
const mockWorkerIsRunning = vi.fn().mockReturnValue(true);

vi.mock('bullmq', () => {
    return {
        Worker: vi.fn().mockImplementation((_name: string, _processor: unknown, _opts: unknown) => {
            return {
                on: mockWorkerOn,
                pause: mockWorkerPause,
                resume: mockWorkerResume,
                close: mockWorkerClose,
                isRunning: mockWorkerIsRunning,
            };
        }),
        Job: vi.fn(),
    };
});

const createMockLogger = () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
});

const mockConnection: ConnectionOptions = { host: 'localhost', port: 6379 };

describe('GaoWorker', () => {
    let logger: ReturnType<typeof createMockLogger>;

    beforeEach(() => {
        vi.clearAllMocks();
        logger = createMockLogger();
    });

    it('should create a worker and attach event listeners', () => {
        const processor = vi.fn();

        new GaoWorker('test-queue', processor, mockConnection, logger as any);

        // Should register 4 event handlers: completed, failed, error, stalled
        expect(mockWorkerOn).toHaveBeenCalledTimes(4);
        expect(mockWorkerOn).toHaveBeenCalledWith('completed', expect.any(Function));
        expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function));
        expect(mockWorkerOn).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockWorkerOn).toHaveBeenCalledWith('stalled', expect.any(Function));

        expect(logger.info).toHaveBeenCalledWith('Worker started for queue: test-queue', {
            concurrency: 5,
        });
    });

    it('should support custom concurrency', () => {
        const processor = vi.fn();

        new GaoWorker('test-queue', processor, mockConnection, logger as any, {
            concurrency: 10,
        });

        expect(logger.info).toHaveBeenCalledWith('Worker started for queue: test-queue', {
            concurrency: 10,
        });
    });

    it('should report running state', () => {
        const processor = vi.fn();
        const worker = new GaoWorker('test-queue', processor, mockConnection, logger as any);

        expect(worker.isRunning()).toBe(true);
    });

    it('should pause the worker', async () => {
        const processor = vi.fn();
        const worker = new GaoWorker('test-queue', processor, mockConnection, logger as any);

        await worker.pause();
        expect(mockWorkerPause).toHaveBeenCalledWith(false);
    });

    it('should resume the worker', () => {
        const processor = vi.fn();
        const worker = new GaoWorker('test-queue', processor, mockConnection, logger as any);

        worker.resume();
        expect(mockWorkerResume).toHaveBeenCalled();
    });

    it('should close the worker gracefully', async () => {
        const processor = vi.fn();
        const worker = new GaoWorker('test-queue', processor, mockConnection, logger as any);

        await worker.close();
        expect(mockWorkerClose).toHaveBeenCalledWith(false);
    });
});
