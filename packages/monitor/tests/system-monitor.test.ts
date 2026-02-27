import { describe, it, expect, afterEach } from 'vitest';
import { SystemMonitor } from '../src/system-monitor.js';
import { MetricsCollector } from '../src/collector.js';

describe('SystemMonitor', () => {
    let monitor: SystemMonitor;

    afterEach(() => {
        monitor?.stop();
    });

    it('should collect a snapshot with valid data', () => {
        const collector = new MetricsCollector();
        monitor = new SystemMonitor(collector);
        const snap = monitor.collectSnapshot();

        expect(snap.timestamp).toBeGreaterThan(0);
        expect(snap.cpu.usage).toBeGreaterThanOrEqual(0);
        expect(snap.memory.rss).toBeGreaterThan(0);
        expect(snap.memory.heapUsed).toBeGreaterThan(0);
        expect(snap.memory.heapTotal).toBeGreaterThan(0);
        expect(snap.uptime).toBeGreaterThan(0);
    });

    it('should store history when started', async () => {
        monitor = new SystemMonitor(undefined, { intervalMs: 50, historySize: 100 });
        monitor.start();

        await new Promise((r) => setTimeout(r, 180));
        monitor.stop();

        const history = monitor.getHistory();
        expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should return recent snapshots', async () => {
        monitor = new SystemMonitor(undefined, { intervalMs: 50, historySize: 100 });
        monitor.start();

        await new Promise((r) => setTimeout(r, 180));
        monitor.stop();

        const recent = monitor.getRecent(2);
        expect(recent.length).toBeLessThanOrEqual(2);
        // Chronological order
        if (recent.length === 2) {
            expect(recent[1]!.timestamp).toBeGreaterThanOrEqual(recent[0]!.timestamp);
        }
    });

    it('should report metrics to collector', async () => {
        const collector = new MetricsCollector();
        monitor = new SystemMonitor(collector, { intervalMs: 50 });
        monitor.start();

        await new Promise((r) => setTimeout(r, 120));
        monitor.stop();

        // Should have reported system gauges
        expect(collector.getGauge('gao_memory_rss_bytes')).toBeGreaterThan(0);
        expect(collector.getGauge('gao_uptime_seconds')).toBeGreaterThan(0);
    });

    it('should not crash if started twice', () => {
        monitor = new SystemMonitor();
        monitor.start();
        expect(() => monitor.start()).not.toThrow();
    });

    it('should return getCurrent without start', () => {
        monitor = new SystemMonitor();
        const snap = monitor.getCurrent();
        expect(snap.memory.rss).toBeGreaterThan(0);
    });
});
