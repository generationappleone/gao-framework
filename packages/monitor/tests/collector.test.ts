import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from '../src/collector.js';

describe('MetricsCollector', () => {
    let collector: MetricsCollector;

    beforeEach(() => {
        collector = new MetricsCollector();
    });

    // ── Counters ──────────────────────────────────

    it('should increment counters', () => {
        collector.increment('requests_total');
        collector.increment('requests_total');
        expect(collector.getCounter('requests_total')).toBe(2);
    });

    it('should increment counters with labels', () => {
        collector.increment('requests_total', { method: 'GET', status: '200' });
        collector.increment('requests_total', { method: 'POST', status: '201' });
        collector.increment('requests_total', { method: 'GET', status: '200' });

        expect(collector.getCounter('requests_total', { method: 'GET', status: '200' })).toBe(2);
        expect(collector.getCounter('requests_total', { method: 'POST', status: '201' })).toBe(1);
    });

    it('should return 0 for unknown counters', () => {
        expect(collector.getCounter('unknown')).toBe(0);
    });

    // ── Gauges ────────────────────────────────────

    it('should set and get gauge values', () => {
        collector.gauge('active_connections', 42);
        expect(collector.getGauge('active_connections')).toBe(42);

        collector.gauge('active_connections', 10);
        expect(collector.getGauge('active_connections')).toBe(10);
    });

    it('should support gauges with labels', () => {
        collector.gauge('memory_bytes', 1024, { type: 'heap' });
        collector.gauge('memory_bytes', 2048, { type: 'rss' });
        expect(collector.getGauge('memory_bytes', { type: 'heap' })).toBe(1024);
        expect(collector.getGauge('memory_bytes', { type: 'rss' })).toBe(2048);
    });

    // ── Histograms ────────────────────────────────

    it('should observe histogram values', () => {
        collector.observe('request_duration_ms', 100);
        collector.observe('request_duration_ms', 200);
        collector.observe('request_duration_ms', 150);

        const json = collector.toJSON() as any;
        expect(json.histograms.request_duration_ms['_default'].count).toBe(3);
        expect(json.histograms.request_duration_ms['_default'].min).toBe(100);
        expect(json.histograms.request_duration_ms['_default'].max).toBe(200);
    });

    it('should bound histogram observations', () => {
        const bounded = new MetricsCollector({ maxHistogramValues: 5 });
        for (let i = 0; i < 10; i++) bounded.observe('test', i);
        const json = bounded.toJSON() as any;
        expect(json.histograms.test['_default'].count).toBe(5);
    });

    // ── Prometheus Export ─────────────────────────

    it('should generate valid Prometheus text format', () => {
        collector.increment('http_requests_total', { method: 'GET' });
        collector.gauge('app_memory_bytes', 12345);
        collector.observe('request_duration_ms', 50);
        collector.observe('request_duration_ms', 100);

        const output = collector.toPrometheus();
        expect(output).toContain('# TYPE http_requests_total counter');
        expect(output).toContain('http_requests_total{method="GET"} 1');
        expect(output).toContain('# TYPE app_memory_bytes gauge');
        expect(output).toContain('app_memory_bytes 12345');
        expect(output).toContain('# TYPE request_duration_ms summary');
        expect(output).toContain('request_duration_ms_count 2');
    });

    // ── JSON Export ───────────────────────────────

    it('should produce structured JSON output', () => {
        collector.increment('reqs', {}, 5);
        collector.gauge('mem', 1024);

        const json = collector.toJSON() as any;
        expect(json.counters.reqs['']).toBe(5);
        expect(json.gauges.mem['']).toBe(1024);
    });

    // ── Reset ─────────────────────────────────────

    it('should reset all metrics', () => {
        collector.increment('a');
        collector.gauge('b', 1);
        collector.observe('c', 5);
        collector.reset();

        expect(collector.getCounter('a')).toBe(0);
        expect(collector.getGauge('b')).toBe(0);
        expect(collector.toPrometheus()).toBe('');
    });

    // ── Label key consistency ─────────────────────

    it('should produce consistent label keys regardless of insertion order', () => {
        collector.increment('test', { b: '2', a: '1' });
        collector.increment('test', { a: '1', b: '2' });
        expect(collector.getCounter('test', { a: '1', b: '2' })).toBe(2);
    });
});
