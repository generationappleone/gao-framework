/**
 * @gao/antivirus — Types & Interfaces
 *
 * All type definitions for the mandatory virus scanning system.
 */

// ─── Scan Results ────────────────────────────────────────────

/**
 * Information about a detected threat.
 */
export interface ThreatInfo {
    /** Malware name/signature. E.g., "Eicar-Signature" */
    name: string;
    /** Severity classification */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Which scanner engine detected this threat */
    engine: string;
}

/**
 * Result of scanning a single file.
 */
export interface ScanResult {
    /** Whether the file is clean (no threats detected) */
    clean: boolean;
    /** List of detected threats (empty if clean) */
    threats: ThreatInfo[];
    /** Scanner that produced this result */
    scanner: string;
    /** Time taken to scan in milliseconds */
    scanTimeMs: number;
    /** SHA-256 hash of the file for audit trail */
    fileHash: string;
}

// ─── Scanner Interface ──────────────────────────────────────

/**
 * All virus scanners MUST implement this interface.
 * Follows Interface Segregation Principle (ISP).
 */
export interface VirusScanner {
    /** Scanner name for logging and identification */
    readonly name: string;
    /** Check if the scanner is available and operational */
    isReady(): Promise<boolean>;
    /** Scan a file by its filesystem path */
    scanFile(filePath: string): Promise<ScanResult>;
    /** Scan file content from a Buffer (for in-memory files) */
    scanBuffer(buffer: Buffer, fileName?: string): Promise<ScanResult>;
}

// ─── Configuration ───────────────────────────────────────────

/**
 * Configuration for the virus scan middleware.
 */
export interface VirusScanConfig {
    /** Scanners to use (runs all, fails if ANY detects a threat) */
    scanners: VirusScanner[];
    /**
     * Behavior when no scanner is available:
     * - 'strict': Reject ALL uploads (production recommended)
     * - 'warn': Log warning, allow upload (staging)
     * - 'allow': Skip scan silently (development only)
     */
    fallbackMode: 'strict' | 'warn' | 'allow';
    /** Maximum file size to scan in bytes. Default: 100MB */
    maxScanSizeBytes?: number;
    /** Directory to quarantine infected files. Default: os.tmpdir()/gao-quarantine */
    quarantineDir?: string;
    /** Callback when a threat is detected */
    onThreatDetected?: (result: ScanResult, fileName: string) => Promise<void>;
}

// ─── Quarantine ──────────────────────────────────────────────

/**
 * A quarantined file record.
 */
export interface QuarantineRecord {
    /** Original filename */
    originalName: string;
    /** Path where the quarantined file is stored */
    quarantinePath: string;
    /** SHA-256 hash of the file */
    fileHash: string;
    /** Detected threats */
    threats: ThreatInfo[];
    /** Timestamp of quarantine */
    quarantinedAt: number;
    /** Which scanner(s) detected the threat */
    detectedBy: string[];
}
