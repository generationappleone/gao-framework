/**
 * @gao/monitor — System Monitor
 *
 * Collects system-level runtime metrics at configurable intervals:
 * - CPU usage percentage
 * - Memory (RSS, heap used/total, system free/total)
 * - Event loop lag
 * - Process uptime
 * - OS load average
 *
 * Stores history in a bounded RingBuffer for dashboard visualization.
 */

import * as os from 'node:os';
import { RingBuffer } from './ring-buffer.js';
import { MetricsCollector } from './collector.js';

export interface SystemSnapshot {
    timestamp: number;
    cpu: {
        usage: number; // 0-100%
        loadAvg: number[]; // 1m, 5m, 15m
    };
    memory: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
        arrayBuffers: number;
        systemFree: number;
        systemTotal: number;
    };
    eventLoop: {
        lagMs: number;
    };
    uptime: number;
}

export interface SystemMonitorOptions {
    /** Collection interval in milliseconds. Default: 1000 (1s). */
    intervalMs?: number;
    /** Number of snapshots to keep in history. Default: 3600 (1 hour at 1/s). */
    historySize?: number;
}

export class SystemMonitor {
    private snapshots: RingBuffer<SystemSnapshot>;
    private interval: ReturnType<typeof setInterval> | undefined;
    private lastCpuInfo = process.cpuUsage();
    private lastCpuTime = Date.now();
    private eventLoopLag = 0;

    constructor(
        private readonly metrics?: MetricsCollector,
        private readonly options: SystemMonitorOptions = {},
    ) {
        const historySize = options.historySize ?? 3600;
        this.snapshots = new RingBuffer<SystemSnapshot>(historySize);
    }

    /** Start collecting system metrics at the configured interval. */
    start(): void {
        if (this.interval) return; // Already running

        const intervalMs = this.options.intervalMs ?? 1000;

        this.interval = setInterval(() => {
            this.measureEventLoopLag();
            const snapshot = this.collectSnapshot();
            this.snapshots.push(snapshot);

            if (this.metrics) {
                this.reportToMetrics(snapshot);
            }
        }, intervalMs);

        if (this.interval.unref) this.interval.unref();
    }

    /** Stop collecting metrics. */
    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }

    /** Collect a single snapshot of current system state. */
    collectSnapshot(): SystemSnapshot {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage(this.lastCpuInfo);
        const now = Date.now();
        const elapsedMs = now - this.lastCpuTime;

        const totalCpuMs = (cpuUsage.user + cpuUsage.system) / 1000;
        const cpuPercent = elapsedMs > 0 ? Math.min(100, (totalCpuMs / elapsedMs) * 100) : 0;

        this.lastCpuInfo = process.cpuUsage();
        this.lastCpuTime = now;

        return {
            timestamp: now,
            cpu: {
                usage: Math.round(cpuPercent * 100) / 100,
                loadAvg: os.loadavg(),
            },
            memory: {
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                arrayBuffers: memUsage.arrayBuffers ?? 0,
                systemFree: os.freemem(),
                systemTotal: os.totalmem(),
            },
            eventLoop: {
                lagMs: this.eventLoopLag,
            },
            uptime: process.uptime(),
        };
    }

    /** Get the full snapshot history. */
    getHistory(): SystemSnapshot[] {
        return this.snapshots.toArray();
    }

    /** Get the last N snapshots. */
    getRecent(n: number): SystemSnapshot[] {
        return this.snapshots.lastN(n);
    }

    /** Get the most recent snapshot. */
    getCurrent(): SystemSnapshot {
        return this.collectSnapshot();
    }

    private measureEventLoopLag(): void {
        const start = Date.now();
        setImmediate(() => {
            this.eventLoopLag = Date.now() - start;
        });
    }

    private reportToMetrics(snapshot: SystemSnapshot): void {
        if (!this.metrics) return;
        this.metrics.gauge('gao_cpu_usage_percent', snapshot.cpu.usage);
        this.metrics.gauge('gao_memory_rss_bytes', snapshot.memory.rss);
        this.metrics.gauge('gao_memory_heap_used_bytes', snapshot.memory.heapUsed);
        this.metrics.gauge('gao_memory_heap_total_bytes', snapshot.memory.heapTotal);
        this.metrics.gauge('gao_event_loop_lag_ms', snapshot.eventLoop.lagMs);
        this.metrics.gauge('gao_uptime_seconds', snapshot.uptime);
        this.metrics.gauge('gao_system_memory_free_bytes', snapshot.memory.systemFree);
    }
}
