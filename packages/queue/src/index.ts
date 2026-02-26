/**
 * @gao/queue — Public API
 *
 * Barrel export: only export what users need.
 */

// ─── Core Classes ────────────────────────────────────────────
export { QueueManager, createQueueManager } from './queue-manager.js';
export { GaoWorker, createWorker } from './worker.js';
export type { ProcessorFn } from './worker.js';
export { Scheduler, createScheduler } from './scheduler.js';
export type { ScheduledJob } from './scheduler.js';

// ─── Plugin ──────────────────────────────────────────────────
export { queuePlugin } from './plugin.js';

// ─── Types ───────────────────────────────────────────────────
export type {
    QueueConfig,
    RedisConnectionConfig,
    QueueDashboardConfig,
    DefaultJobOptions,
    JobDefinition,
    JobOptions,
    RepeatOptions,
    JobResult,
    JobProcessor,
    WorkerOptions,
    QueueEvents,
} from './types.js';
