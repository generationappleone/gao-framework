/**
 * @gao/antivirus — Virus Scan Function
 *
 * MANDATORY scanning function for all file uploads.
 * Must be called before any file is persisted to storage.
 *
 * This is a framework-agnostic function (not middleware) that can be
 * integrated into any HTTP framework's upload pipeline.
 */

import type { ScanResult, VirusScanner, VirusScanConfig } from '../types.js';
import { QuarantineManager } from '../quarantine/quarantine-manager.js';

export interface FileToScan {
    /** Filesystem path to the uploaded temp file */
    filePath: string;
    /** Original filename from the upload */
    originalName: string;
    /** File buffer (optional — if available, some scanners can use it) */
    buffer?: Buffer;
}

export interface VirusScanResult {
    /** Whether the file passed all scans */
    clean: boolean;
    /** Aggregated results from all scanners */
    results: ScanResult[];
    /** Whether the file was quarantined (only if infected) */
    quarantined: boolean;
}

/**
 * Scan a file for viruses using the configured scanners.
 *
 * @param file - The file to scan
 * @param config - Scanner configuration
 * @returns Scan results
 */
export async function scanFile(
    file: FileToScan,
    config: VirusScanConfig,
): Promise<VirusScanResult> {
    // Check which scanners are available
    const readyScanners: VirusScanner[] = [];
    for (const scanner of config.scanners) {
        if (await scanner.isReady()) {
            readyScanners.push(scanner);
        }
    }

    // Handle no available scanners
    if (readyScanners.length === 0) {
        if (config.fallbackMode === 'strict') {
            throw new Error(
                'No virus scanners available. Cannot process uploads in strict mode. ' +
                'Ensure ClamAV daemon is running.',
            );
        }

        if (config.fallbackMode === 'warn') {
            console.warn(
                `[GAO:antivirus] ⚠️ No scanner available for "${file.originalName}". ` +
                'File accepted without scanning (fallbackMode: warn).',
            );
        }

        return { clean: true, results: [], quarantined: false };
    }

    // Check file size limit — REJECT oversized files (security: prevent bypass)
    const maxSize = config.maxScanSizeBytes ?? 104_857_600; // 100MB
    let fileSize = file.buffer?.length;

    // If buffer not available, check disk size
    if (fileSize === undefined) {
        try {
            const { stat } = await import('node:fs/promises');
            const stats = await stat(file.filePath);
            fileSize = stats.size;
        } catch {
            // Cannot determine size — proceed with scan (fail-safe)
        }
    }

    if (fileSize !== undefined && fileSize > maxSize) {
        throw new Error(
            `File "${file.originalName}" exceeds max scan size ` +
            `(${fileSize} > ${maxSize} bytes). Upload rejected.`,
        );
    }

    // Run all available scanners
    const scanPromises = readyScanners.map(async (scanner) => {
        try {
            return await scanner.scanFile(file.filePath);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[GAO:antivirus] ${scanner.name} scan error: ${msg}`);
            // Return a "clean" result for failed scanners — other scanners may catch it
            return null;
        }
    });

    const rawResults = await Promise.all(scanPromises);
    const results = rawResults.filter((r): r is ScanResult => r !== null);

    // Check if ANY scanner found a threat
    const threatResults = results.filter(r => !r.clean);
    const isClean = threatResults.length === 0;

    let quarantined = false;

    if (!isClean) {
        // Quarantine the infected file
        const quarantineDir = config.quarantineDir;
        const manager = new QuarantineManager(quarantineDir);
        const primaryThreat = threatResults[0]!;

        await manager.quarantine(file.filePath, file.originalName, primaryThreat);
        quarantined = true;

        // Alert callback
        if (config.onThreatDetected) {
            try {
                await config.onThreatDetected(primaryThreat, file.originalName);
            } catch (alertError) {
                // Don't let alert failures prevent the quarantine response
                console.error('[GAO:antivirus] Alert callback failed:', alertError);
            }
        }
    }

    return { clean: isClean, results, quarantined };
}
