/**
 * @gao/queue — Type Definitions
 *
 * All interfaces and types for the queue package.
 * Follows DIP: services depend on these abstractions, not concrete implementations.
 */


// ─── Config ──────────────────────────────────────────────────

export interface RedisConnectionConfig {
    readonly host: string;
    readonly port: number;
    readonly password?: string;
    readonly db?: number;
    readonly tls?: boolean;
}

export interface QueueDashboardConfig {
    readonly enabled: boolean;
    readonly path: string;
}

export interface DefaultJobOptions {
    readonly attempts: number;
    readonly backoff: {
        readonly type: 'exponential' | 'fixed';
        readonly delay: number;
    };
    readonly removeOnComplete: number | boolean;
    readonly removeOnFail: number | boolean;
}

export interface QueueConfig {
    readonly enabled: boolean;
    readonly redis: RedisConnectionConfig;
    readonly dashboard?: QueueDashboardConfig;
    readonly defaultJobOptions?: DefaultJobOptions;
}

// ─── Job ─────────────────────────────────────────────────────

export interface JobDefinition<T = unknown> {
    readonly name: string;
    readonly data: T;
    readonly options?: JobOptions;
}

export interface JobOptions {
    readonly delay?: number;
    readonly attempts?: number;
    readonly backoff?: {
        readonly type: 'exponential' | 'fixed';
        readonly delay: number;
    };
    readonly priority?: number;
    readonly removeOnComplete?: number | boolean;
    readonly removeOnFail?: number | boolean;
    readonly repeat?: RepeatOptions;
    readonly jobId?: string;
}

export interface RepeatOptions {
    readonly pattern?: string; // Cron pattern
    readonly every?: number; // Milliseconds
    readonly limit?: number; // Max repetitions
}

export interface JobResult<T = unknown> {
    readonly id: string;
    readonly name: string;
    readonly data: T;
    readonly attemptsMade: number;
    readonly timestamp: number;
}

// ─── Worker ──────────────────────────────────────────────────

export type JobProcessor<TData = unknown, TResult = unknown> = (
    job: JobResult<TData>,
) => Promise<TResult> | TResult;

export interface WorkerOptions {
    readonly concurrency?: number;
    readonly limiter?: {
        readonly max: number;
        readonly duration: number;
    };
    readonly autorun?: boolean;
}

// ─── Events ──────────────────────────────────────────────────

export interface QueueEvents {
    readonly completed: (jobId: string, result: unknown) => void;
    readonly failed: (jobId: string, error: Error, attemptsMade: number) => void;
    readonly progress: (jobId: string, progress: number | object) => void;
    readonly stalled: (jobId: string) => void;
}
