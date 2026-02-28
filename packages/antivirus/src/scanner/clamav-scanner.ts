/**
 * @gao/antivirus — ClamAV Scanner
 *
 * Integrates with the ClamAV daemon (clamd) for production-grade
 * virus scanning of uploaded files.
 *
 * Requirements:
 * - ClamAV daemon must be running (Docker, systemd, or manual)
 * - npm package 'clamscan' must be installed
 *
 * Connection methods:
 * - TCP socket (host:port) — for remote/Docker ClamAV
 * - Unix socket (socketPath) — for local ClamAV
 */

import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import type NodeClam from 'clamscan';
import type { ScanResult, VirusScanner } from '../types.js';

export interface ClamAVConfig {
    /** ClamAV daemon host. Default: '127.0.0.1' */
    host?: string;
    /** ClamAV daemon port. Default: 3310 */
    port?: number;
    /** Unix socket path (alternative to host:port) */
    socketPath?: string;
    /** Connection timeout in ms. Default: 10000 (10s) */
    timeout?: number;
    /** Path to clamscan binary (fallback if daemon unavailable) */
    clamdscanPath?: string;
}

/**
 * ClamAV Scanner — connects to clamd daemon for file scanning.
 */
export class ClamAVScanner implements VirusScanner {
    readonly name = 'ClamAV';
    private clam: NodeClam | null = null;
    private ready = false;

    constructor(private readonly config: ClamAVConfig = {}) { }

    async isReady(): Promise<boolean> {
        try {
            // Dynamic import — clamscan is an optional dependency
            const NodeClam = await this.loadNodeClam();
            if (!NodeClam) return false;

            this.clam = await new NodeClam().init({
                removeInfected: false,
                quarantineInfected: false,
                debugMode: false,
                clamdscan: {
                    host: this.config.host ?? '127.0.0.1',
                    port: this.config.port ?? 3310,
                    socket: this.config.socketPath ?? null,
                    timeout: this.config.timeout ?? 10_000,
                    localFallback: true,
                    path: this.config.clamdscanPath ?? '/usr/bin/clamdscan',
                    active: true,
                },
                preference: 'clamdscan',
            });

            this.ready = true;
            return true;
        } catch {
            this.ready = false;
            return false;
        }
    }

    async scanFile(filePath: string): Promise<ScanResult> {
        this.ensureReady();

        const start = Date.now();

        // Compute file hash for audit
        let fileHash = 'unknown';
        try {
            const data = await fs.readFile(filePath);
            fileHash = createHash('sha256').update(data).digest('hex');
        } catch {
            // If we can't read the file for hashing, continue with scan anyway
        }

        try {
            const { isInfected, viruses } = await this.clam!.isInfected(filePath);

            return {
                clean: !isInfected,
                threats: (viruses ?? []).map((v: string) => ({
                    name: v,
                    severity: 'high' as const,
                    engine: 'ClamAV',
                })),
                scanner: this.name,
                scanTimeMs: Date.now() - start,
                fileHash,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`ClamAV scan failed: ${message}`);
        }
    }

    async scanBuffer(buffer: Buffer, fileName?: string): Promise<ScanResult> {
        this.ensureReady();

        const start = Date.now();
        const fileHash = createHash('sha256').update(buffer).digest('hex');

        try {
            const stream = Readable.from(buffer);
            const { isInfected, viruses } = await this.clam!.scanStream(stream);

            return {
                clean: !isInfected,
                threats: (viruses ?? []).map((v: string) => ({
                    name: v,
                    severity: 'high' as const,
                    engine: 'ClamAV',
                })),
                scanner: this.name,
                scanTimeMs: Date.now() - start,
                fileHash,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`ClamAV stream scan failed for "${fileName ?? 'buffer'}": ${message}`);
        }
    }

    /**
     * Dynamically load the 'clamscan' package.
     * Returns null if the package is not installed.
     */
    private async loadNodeClam(): Promise<(new () => NodeClam) | null> {
        try {
            const mod = await import('clamscan');
            return (mod.default ?? mod) as new () => NodeClam;
        } catch {
            console.warn(
                '[GAO:antivirus:clamav] clamscan package not installed. ' +
                'Install with: npm install clamscan',
            );
            return null;
        }
    }

    private ensureReady(): void {
        if (!this.ready || !this.clam) {
            throw new Error('ClamAV scanner not initialized. Call isReady() first.');
        }
    }
}
