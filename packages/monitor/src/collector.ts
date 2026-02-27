/**
 * @gao/monitor — Metrics Collector
 *
 * Application-wide metrics with three instrument types:
 * - Counter: monotonically increasing (requests, errors)
 * - Gauge: current value, can go up or down (connections, memory)
 * - Histogram: value distributions (latency, response size)
 *
 * Supports labels for dimensional metrics.
 * Outputs Prometheus text format and JSON for dashboards.
 */

export type MetricType = 'counter' | 'gauge' | 'histogram';

export class MetricsCollector {
    private readonly counters = new Map<string, Map<string, number>>();
    private readonly gauges = new Map<string, Map<string, number>>();
    private readonly histograms = new Map<string, Map<string, number[]>>();
    private readonly maxHistogramValues: number;

    constructor(options?: { maxHistogramValues?: number }) {
        this.maxHistogramValues = options?.maxHistogramValues ?? 1000;
    }

    // ── Counters ─────────────────────────────────────────────

    /**
     * Increment a counter (monotonically increasing).
     * Use for: total requests, errors, queries, bytes sent.
     */
    increment(name: string, labels: Record<string, string> = {}, delta = 1): void {
        const key = this.labelKey(labels);
        let map = this.counters.get(name);
        if (!map) {
            map = new Map();
            this.counters.set(name, map);
        }
        const current = map.get(key) ?? 0;
        map.set(key, current + delta);
    }

    /** Get a counter's current value. */
    getCounter(name: string, labels: Record<string, string> = {}): number {
        return this.counters.get(name)?.get(this.labelKey(labels)) ?? 0;
    }

    // ── Gauges ───────────────────────────────────────────────

    /**
     * Set a gauge (current value, can go up or down).
     * Use for: active connections, memory usage, queue depth.
     */
    gauge(name: string, value: number, labels: Record<string, string> = {}): void {
        const key = this.labelKey(labels);
        let map = this.gauges.get(name);
        if (!map) {
            map = new Map();
            this.gauges.set(name, map);
        }
        map.set(key, value);
    }

    /** Get a gauge's current value. */
    getGauge(name: string, labels: Record<string, string> = {}): number {
        return this.gauges.get(name)?.get(this.labelKey(labels)) ?? 0;
    }

    // ── Histograms ─────────────────────────────────────────

    /**
     * Record a histogram observation (for distributions).
     * Use for: request latency, response size, query time.
     */
    observe(name: string, value: number, labels: Record<string, string> = {}): void {
        const key = this.labelKey(labels);
        let map = this.histograms.get(name);
        if (!map) {
            map = new Map();
            this.histograms.set(name, map);
        }
        let values = map.get(key);
        if (!values) {
            values = [];
            map.set(key, values);
        }
        // Bounded: keep only the last N observations
        if (values.length >= this.maxHistogramValues) values.shift();
        values.push(value);
    }

    // ── Export: Prometheus Text Format ─────────────────────

    /** Generate Prometheus-compatible text format output. */
    toPrometheus(): string {
        const lines: string[] = [];

        for (const [name, map] of this.counters) {
            lines.push(`# TYPE ${name} counter`);
            for (const [key, value] of map) {
                lines.push(`${name}${key} ${value}`);
            }
        }

        for (const [name, map] of this.gauges) {
            lines.push(`# TYPE ${name} gauge`);
            for (const [key, value] of map) {
                lines.push(`${name}${key} ${value}`);
            }
        }

        for (const [name, map] of this.histograms) {
            lines.push(`# TYPE ${name} summary`);
            for (const [key, values] of map) {
                if (values.length === 0) continue;
                const sorted = [...values].sort((a, b) => a - b);
                const p50 = sorted[Math.floor(sorted.length * 0.5)]!;
                const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
                const p99 = sorted[Math.floor(sorted.length * 0.99)]!;
                const sum = values.reduce((a, b) => a + b, 0);
                lines.push(`${name}{quantile="0.5"${key ? ',' + key.slice(1, -1) : ''}} ${p50}`);
                lines.push(`${name}{quantile="0.95"${key ? ',' + key.slice(1, -1) : ''}} ${p95}`);
                lines.push(`${name}{quantile="0.99"${key ? ',' + key.slice(1, -1) : ''}} ${p99}`);
                lines.push(`${name}_sum${key} ${sum}`);
                lines.push(`${name}_count${key} ${values.length}`);
            }
        }

        return lines.join('\n');
    }

    // ── Export: JSON ───────────────────────────────────────

    /** Get JSON snapshot for dashboards. */
    toJSON(): Record<string, unknown> {
        const counterData: Record<string, Record<string, number>> = {};
        for (const [name, map] of this.counters) {
            counterData[name] = Object.fromEntries(map);
        }

        const gaugeData: Record<string, Record<string, number>> = {};
        for (const [name, map] of this.gauges) {
            gaugeData[name] = Object.fromEntries(map);
        }

        const histogramData: Record<string, Record<string, object>> = {};
        for (const [name, map] of this.histograms) {
            const summaries: Record<string, object> = {};
            for (const [key, values] of map) {
                if (values.length === 0) continue;
                const sorted = [...values].sort((a, b) => a - b);
                summaries[key || '_default'] = {
                    count: values.length,
                    min: sorted[0],
                    max: sorted[sorted.length - 1],
                    avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100,
                    p50: sorted[Math.floor(sorted.length * 0.5)],
                    p95: sorted[Math.floor(sorted.length * 0.95)],
                    p99: sorted[Math.floor(sorted.length * 0.99)],
                };
            }
            histogramData[name] = summaries;
        }

        return {
            counters: counterData,
            gauges: gaugeData,
            histograms: histogramData,
        };
    }

    /** Reset all metrics. */
    reset(): void {
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
    }

    // ── Internal ──────────────────────────────────────────

    private labelKey(labels: Record<string, string>): string {
        const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
        if (entries.length === 0) return '';
        return `{${entries.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
    }
}
