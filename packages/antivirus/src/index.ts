/**
 * @gao/antivirus — Public API
 *
 * Mandatory virus scanning for all file uploads in GAO Framework.
 * Ensures no malware reaches storage — regardless of storage backend.
 */

// ─── Types ───────────────────────────────────────────────────
export type {
    ThreatInfo,
    ScanResult,
    VirusScanner,
    VirusScanConfig,
    QuarantineRecord,
} from './types.js';

// ─── Scanners ────────────────────────────────────────────────
export { NoopScanner } from './scanner/noop-scanner.js';
export { ClamAVScanner } from './scanner/clamav-scanner.js';
export type { ClamAVConfig } from './scanner/clamav-scanner.js';
export { MultiScanner } from './scanner/multi-scanner.js';

// ─── Quarantine ──────────────────────────────────────────────
export { QuarantineManager } from './quarantine/quarantine-manager.js';

// ─── Scan Function ───────────────────────────────────────────
export { scanFile } from './middleware/virus-scan.js';
export type { FileToScan, VirusScanResult } from './middleware/virus-scan.js';
