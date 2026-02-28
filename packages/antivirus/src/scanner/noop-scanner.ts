/**
 * @gao/antivirus — No-Op Scanner
 *
 * A placeholder scanner for development environments.
 * Always returns "clean" results. Logs a warning on every scan
 * to remind developers that real scanning is not active.
 */

import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import type { ScanResult, VirusScanner } from '../types.js';

export class NoopScanner implements VirusScanner {
    readonly name = 'NoopScanner';

    async isReady(): Promise<boolean> {
        return true; // Always ready
    }

    async scanFile(filePath: string): Promise<ScanResult> {
        const start = Date.now();

        let fileHash = 'unknown';
        try {
            const data = await fs.readFile(filePath);
            fileHash = createHash('sha256').update(data).digest('hex');
        } catch {
            // File might not exist — still return clean for noop
        }

        console.warn(
            `[GAO:antivirus:noop] ⚠️ File "${filePath}" was NOT scanned. ` +
            'NoopScanner is active (development mode). ' +
            'Use ClamAVScanner or VirusTotalScanner in production.',
        );

        return {
            clean: true,
            threats: [],
            scanner: this.name,
            scanTimeMs: Date.now() - start,
            fileHash,
        };
    }

    async scanBuffer(buffer: Buffer, fileName?: string): Promise<ScanResult> {
        const start = Date.now();
        const fileHash = createHash('sha256').update(buffer).digest('hex');

        console.warn(
            `[GAO:antivirus:noop] ⚠️ Buffer "${fileName ?? 'unknown'}" was NOT scanned. ` +
            'NoopScanner is active (development mode).',
        );

        return {
            clean: true,
            threats: [],
            scanner: this.name,
            scanTimeMs: Date.now() - start,
            fileHash,
        };
    }
}
