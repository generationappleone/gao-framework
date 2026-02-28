/**
 * @gao/antivirus — Quarantine Manager
 *
 * Isolates infected files in a secure quarantine directory.
 * Maintains a JSON log of all quarantined files for forensic analysis.
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import type { QuarantineRecord, ScanResult } from '../types.js';

export class QuarantineManager {
    private readonly quarantineDir: string;
    private readonly logPath: string;

    constructor(quarantineDir?: string) {
        this.quarantineDir = quarantineDir ?? path.join(tmpdir(), 'gao-quarantine');
        this.logPath = path.join(this.quarantineDir, 'quarantine-log.json');
    }

    /**
     * Initialize the quarantine directory.
     */
    async init(): Promise<void> {
        await fs.mkdir(this.quarantineDir, { recursive: true });

        // Create log file if it doesn't exist
        try {
            await fs.access(this.logPath);
        } catch {
            await fs.writeFile(this.logPath, '[]', 'utf-8');
        }
    }

    /**
     * Quarantine an infected file.
     * Moves the file to the quarantine directory and logs the record.
     *
     * @param filePath - Path to the infected file
     * @param originalName - Original filename from the upload
     * @param scanResult - The scan result that detected the threat
     * @returns The quarantine record
     */
    async quarantine(
        filePath: string,
        originalName: string,
        scanResult: ScanResult,
    ): Promise<QuarantineRecord> {
        await this.init();

        // Generate a safe quarantine filename
        const quarantineId = randomUUID();
        const ext = path.extname(originalName);
        const safeFilename = `${quarantineId}${ext}.quarantined`;
        const quarantinePath = path.join(this.quarantineDir, safeFilename);

        // Move file to quarantine (copy + delete original)
        try {
            await fs.copyFile(filePath, quarantinePath);
            await fs.unlink(filePath);
        } catch {
            // If we can't copy, at least try to delete the original
            try { await fs.unlink(filePath); } catch { /* best effort */ }
        }

        // Create quarantine record
        const record: QuarantineRecord = {
            originalName,
            quarantinePath,
            fileHash: scanResult.fileHash,
            threats: scanResult.threats,
            quarantinedAt: Date.now(),
            detectedBy: [scanResult.scanner],
        };

        // Append to quarantine log
        await this.appendLog(record);

        return record;
    }

    /**
     * List all quarantined files.
     */
    async listQuarantined(): Promise<QuarantineRecord[]> {
        try {
            const raw = await fs.readFile(this.logPath, 'utf-8');
            return JSON.parse(raw) as QuarantineRecord[];
        } catch {
            return [];
        }
    }

    /**
     * Delete a quarantined file permanently.
     */
    async deleteQuarantined(quarantinePath: string): Promise<void> {
        try {
            await fs.unlink(quarantinePath);
        } catch {
            // File might already be deleted
        }

        // Remove from log
        const records = await this.listQuarantined();
        const filtered = records.filter(r => r.quarantinePath !== quarantinePath);
        await fs.writeFile(this.logPath, JSON.stringify(filtered, null, 2), 'utf-8');
    }

    /**
     * Append a record to the quarantine log.
     */
    private async appendLog(record: QuarantineRecord): Promise<void> {
        const records = await this.listQuarantined();
        records.push(record);
        await fs.writeFile(this.logPath, JSON.stringify(records, null, 2), 'utf-8');
    }
}
