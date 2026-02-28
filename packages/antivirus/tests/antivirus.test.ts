import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import { NoopScanner } from '../src/scanner/noop-scanner.js';
import { MultiScanner } from '../src/scanner/multi-scanner.js';
import { QuarantineManager } from '../src/quarantine/quarantine-manager.js';
import { scanFile } from '../src/middleware/virus-scan.js';
import type { ScanResult, VirusScanner } from '../src/types.js';

// ─── Mock Scanner (always detects EICAR) ─────────────────────

class MockInfectedScanner implements VirusScanner {
    readonly name = 'MockInfected';

    async isReady(): Promise<boolean> { return true; }

    async scanFile(_filePath: string): Promise<ScanResult> {
        return {
            clean: false,
            threats: [{ name: 'Eicar-Test-Signature', severity: 'high', engine: 'Mock' }],
            scanner: this.name,
            scanTimeMs: 1,
            fileHash: 'abc123',
        };
    }

    async scanBuffer(_buffer: Buffer): Promise<ScanResult> {
        return this.scanFile('');
    }
}

class MockCleanScanner implements VirusScanner {
    readonly name = 'MockClean';

    async isReady(): Promise<boolean> { return true; }

    async scanFile(_filePath: string): Promise<ScanResult> {
        return {
            clean: true,
            threats: [],
            scanner: this.name,
            scanTimeMs: 1,
            fileHash: 'def456',
        };
    }

    async scanBuffer(_buffer: Buffer): Promise<ScanResult> {
        return this.scanFile('');
    }
}

class MockUnavailableScanner implements VirusScanner {
    readonly name = 'MockUnavailable';
    async isReady(): Promise<boolean> { return false; }
    async scanFile(): Promise<ScanResult> { throw new Error('Not available'); }
    async scanBuffer(): Promise<ScanResult> { throw new Error('Not available'); }
}

// ─── Tests ───────────────────────────────────────────────────

describe('NoopScanner', () => {
    it('should always be ready', async () => {
        const scanner = new NoopScanner();
        expect(await scanner.isReady()).toBe(true);
    });

    it('should always return clean', async () => {
        const scanner = new NoopScanner();
        const result = await scanner.scanBuffer(Buffer.from('test content'));
        expect(result.clean).toBe(true);
        expect(result.threats).toEqual([]);
        expect(result.scanner).toBe('NoopScanner');
    });

    it('should compute file hash for buffer', async () => {
        const scanner = new NoopScanner();
        const result = await scanner.scanBuffer(Buffer.from('hello'));
        expect(result.fileHash).toBeTruthy();
        expect(result.fileHash).not.toBe('unknown');
    });
});

describe('MultiScanner', () => {
    it('should require at least one scanner', () => {
        expect(() => new MultiScanner([])).toThrow('at least one scanner');
    });

    it('should be ready if at least one scanner is ready', async () => {
        const multi = new MultiScanner([new MockUnavailableScanner(), new MockCleanScanner()]);
        expect(await multi.isReady()).toBe(true);
    });

    it('should not be ready if no scanners are ready', async () => {
        const multi = new MultiScanner([new MockUnavailableScanner()]);
        expect(await multi.isReady()).toBe(false);
    });

    it('should detect infection from any scanner', async () => {
        const multi = new MultiScanner([new MockCleanScanner(), new MockInfectedScanner()]);

        // Create a temp file
        const tempFile = path.join(tmpdir(), `test-multi-${randomBytes(4).toString('hex')}.bin`);
        await fs.writeFile(tempFile, 'test');

        try {
            const result = await multi.scanFile(tempFile);
            expect(result.clean).toBe(false);
            expect(result.threats.length).toBeGreaterThan(0);
        } finally {
            await fs.unlink(tempFile).catch(() => { });
        }
    });

    it('should return clean if all scanners say clean', async () => {
        const multi = new MultiScanner([new MockCleanScanner(), new MockCleanScanner()]);

        const tempFile = path.join(tmpdir(), `test-clean-${randomBytes(4).toString('hex')}.bin`);
        await fs.writeFile(tempFile, 'safe content');

        try {
            const result = await multi.scanFile(tempFile);
            expect(result.clean).toBe(true);
            expect(result.threats).toEqual([]);
        } finally {
            await fs.unlink(tempFile).catch(() => { });
        }
    });
});

describe('QuarantineManager', () => {
    let qDir: string;
    let manager: QuarantineManager;

    beforeEach(async () => {
        qDir = path.join(tmpdir(), `gao-quarantine-test-${randomBytes(4).toString('hex')}`);
        manager = new QuarantineManager(qDir);
        await manager.init();
    });

    afterEach(async () => {
        try { await fs.rm(qDir, { recursive: true }); } catch { /* ignore */ }
    });

    it('should initialize quarantine directory', async () => {
        const stat = await fs.stat(qDir);
        expect(stat.isDirectory()).toBe(true);
    });

    it('should quarantine an infected file', async () => {
        // Create a "malicious" temp file
        const maliciousFile = path.join(tmpdir(), `malware-${randomBytes(4).toString('hex')}.exe`);
        await fs.writeFile(maliciousFile, 'MALICIOUS CONTENT');

        const scanResult: ScanResult = {
            clean: false,
            threats: [{ name: 'Trojan.Test', severity: 'high', engine: 'Mock' }],
            scanner: 'MockScanner',
            scanTimeMs: 5,
            fileHash: 'abc123',
        };

        const record = await manager.quarantine(maliciousFile, 'malware.exe', scanResult);

        expect(record.originalName).toBe('malware.exe');
        expect(record.quarantinePath).toContain('.quarantined');
        expect(record.threats[0]!.name).toBe('Trojan.Test');

        // Original file should be deleted
        await expect(fs.access(maliciousFile)).rejects.toThrow();
    });

    it('should list quarantined files', async () => {
        const tempFile = path.join(tmpdir(), `test-q-${randomBytes(4).toString('hex')}.bin`);
        await fs.writeFile(tempFile, 'content');

        const scanResult: ScanResult = {
            clean: false,
            threats: [{ name: 'Virus.A', severity: 'critical', engine: 'Mock' }],
            scanner: 'Mock',
            scanTimeMs: 1,
            fileHash: 'hash1',
        };

        await manager.quarantine(tempFile, 'virus.bin', scanResult);

        const list = await manager.listQuarantined();
        expect(list.length).toBe(1);
        expect(list[0]!.originalName).toBe('virus.bin');
    });
});

describe('scanFile (virus-scan function)', () => {
    it('should return clean for clean files', async () => {
        const tempFile = path.join(tmpdir(), `clean-${randomBytes(4).toString('hex')}.txt`);
        await fs.writeFile(tempFile, 'safe content');

        try {
            const result = await scanFile(
                { filePath: tempFile, originalName: 'safe.txt' },
                {
                    scanners: [new MockCleanScanner()],
                    fallbackMode: 'strict',
                },
            );

            expect(result.clean).toBe(true);
            expect(result.quarantined).toBe(false);
        } finally {
            await fs.unlink(tempFile).catch(() => { });
        }
    });

    it('should detect and quarantine infected files', async () => {
        const qDir = path.join(tmpdir(), `gao-q-test-${randomBytes(4).toString('hex')}`);
        const tempFile = path.join(tmpdir(), `infected-${randomBytes(4).toString('hex')}.exe`);
        await fs.writeFile(tempFile, 'EICAR test content');

        try {
            const result = await scanFile(
                { filePath: tempFile, originalName: 'malware.exe' },
                {
                    scanners: [new MockInfectedScanner()],
                    fallbackMode: 'strict',
                    quarantineDir: qDir,
                },
            );

            expect(result.clean).toBe(false);
            expect(result.quarantined).toBe(true);
            expect(result.results.some(r => !r.clean)).toBe(true);
        } finally {
            await fs.rm(qDir, { recursive: true }).catch(() => { });
        }
    });

    it('should throw in strict mode when no scanner available', async () => {
        const tempFile = path.join(tmpdir(), `strict-${randomBytes(4).toString('hex')}.txt`);
        await fs.writeFile(tempFile, 'content');

        try {
            await expect(
                scanFile(
                    { filePath: tempFile, originalName: 'test.txt' },
                    {
                        scanners: [new MockUnavailableScanner()],
                        fallbackMode: 'strict',
                    },
                ),
            ).rejects.toThrow('No virus scanners available');
        } finally {
            await fs.unlink(tempFile).catch(() => { });
        }
    });

    it('should allow uploads in warn mode when no scanner available', async () => {
        const tempFile = path.join(tmpdir(), `warn-${randomBytes(4).toString('hex')}.txt`);
        await fs.writeFile(tempFile, 'content');

        try {
            const result = await scanFile(
                { filePath: tempFile, originalName: 'test.txt' },
                {
                    scanners: [new MockUnavailableScanner()],
                    fallbackMode: 'warn',
                },
            );

            expect(result.clean).toBe(true);
            expect(result.results).toEqual([]);
        } finally {
            await fs.unlink(tempFile).catch(() => { });
        }
    });

    it('should call onThreatDetected callback', async () => {
        const qDir = path.join(tmpdir(), `gao-q-callback-${randomBytes(4).toString('hex')}`);
        const tempFile = path.join(tmpdir(), `cb-${randomBytes(4).toString('hex')}.exe`);
        await fs.writeFile(tempFile, 'malicious');

        let callbackCalled = false;
        let callbackFileName = '';

        try {
            await scanFile(
                { filePath: tempFile, originalName: 'payload.exe' },
                {
                    scanners: [new MockInfectedScanner()],
                    fallbackMode: 'strict',
                    quarantineDir: qDir,
                    onThreatDetected: async (_result, fileName) => {
                        callbackCalled = true;
                        callbackFileName = fileName;
                    },
                },
            );

            expect(callbackCalled).toBe(true);
            expect(callbackFileName).toBe('payload.exe');
        } finally {
            await fs.rm(qDir, { recursive: true }).catch(() => { });
        }
    });
});
