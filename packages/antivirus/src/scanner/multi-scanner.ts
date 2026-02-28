/**
 * @gao/antivirus — Multi-Scanner
 *
 * Runs multiple virus scanners in parallel and aggregates results.
 * A file is considered infected if ANY scanner detects a threat.
 */

import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import type { ScanResult, VirusScanner } from '../types.js';

export class MultiScanner implements VirusScanner {
    readonly name = 'MultiScanner';

    constructor(private readonly scanners: VirusScanner[]) {
        if (scanners.length === 0) {
            throw new Error('MultiScanner requires at least one scanner');
        }
    }

    async isReady(): Promise<boolean> {
        // Ready if at least ONE scanner is ready
        const results = await Promise.all(this.scanners.map(s => s.isReady()));
        return results.some(Boolean);
    }

    /**
     * Get only the scanners that are currently operational.
     */
    async getReadyScanners(): Promise<VirusScanner[]> {
        const readyChecks = await Promise.all(
            this.scanners.map(async (s) => ({ scanner: s, ready: await s.isReady() })),
        );
        return readyChecks.filter(c => c.ready).map(c => c.scanner);
    }

    async scanFile(filePath: string): Promise<ScanResult> {
        const readyScanners = await this.getReadyScanners();
        if (readyScanners.length === 0) {
            throw new Error('No scanners available');
        }

        const start = Date.now();

        // Compute hash once (don't repeat per scanner)
        let fileHash = 'unknown';
        try {
            const data = await fs.readFile(filePath);
            fileHash = createHash('sha256').update(data).digest('hex');
        } catch {
            // Continue without hash
        }

        // Run all scanners in parallel
        const results = await Promise.allSettled(
            readyScanners.map(s => s.scanFile(filePath)),
        );

        return this.aggregateResults(results, start, fileHash);
    }

    async scanBuffer(buffer: Buffer, fileName?: string): Promise<ScanResult> {
        const readyScanners = await this.getReadyScanners();
        if (readyScanners.length === 0) {
            throw new Error('No scanners available');
        }

        const start = Date.now();
        const fileHash = createHash('sha256').update(buffer).digest('hex');

        const results = await Promise.allSettled(
            readyScanners.map(s => s.scanBuffer(buffer, fileName)),
        );

        return this.aggregateResults(results, start, fileHash);
    }

    /**
     * Aggregate results from multiple scanners.
     * A file is INFECTED if ANY scanner detects a threat.
     */
    private aggregateResults(
        results: PromiseSettledResult<ScanResult>[],
        startTime: number,
        fileHash: string,
    ): ScanResult {
        const allThreats = [];
        let isClean = true;

        for (const result of results) {
            if (result.status === 'fulfilled') {
                if (!result.value.clean) {
                    isClean = false;
                    allThreats.push(...result.value.threats);
                }
            }
            // Rejected scanners are ignored — if one scanner fails,
            // we still trust the others. Log would be appropriate here.
        }

        return {
            clean: isClean,
            threats: allThreats,
            scanner: this.name,
            scanTimeMs: Date.now() - startTime,
            fileHash,
        };
    }
}
