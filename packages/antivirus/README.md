# @gao/antivirus

Mandatory file upload virus scanning layer for the GAO Framework. Every uploaded file **must** pass through this scanner before being persisted to storage — no exceptions in production.

## Features

-   **Multi-Scanner Architecture** — Run multiple virus engines in parallel; a file is infected if **any** scanner reports a threat.
-   **ClamAV Integration** — Production scanner using the ClamAV daemon (clamd) via TCP or Unix socket.
-   **NoopScanner (Dev)** — Development scanner that always returns clean with warning logs reminding developers to use real scanners.
-   **Quarantine Manager** — Automatically isolates infected files in a dedicated directory with a JSON audit log.
-   **Framework-Agnostic** — The `scanFile()` function is not middleware — it can be called from any HTTP framework's upload pipeline.
-   **Fallback Modes** — `strict` (reject if no scanner available), `warn` (accept with warning), `allow` (accept silently).
-   **File Size Enforcement** — Oversized files are **rejected** (not silently skipped) to prevent bypass attacks.
-   **SHA-256 Audit Trail** — Every scanned file is hashed for forensic tracking.

## Architecture

```
Upload Request
     │
     ▼
┌─────────────────────────────────┐
│  scanFile(file, config)         │
│                                 │
│  ① Check scanner availability   │
│  ② Check file size (fs.stat)    │
│  ③ Run all scanners in parallel │
│  ④ Aggregate results            │
│  ⑤ If infected → quarantine     │
│  ⑥ Trigger alert callback       │
│  ⑦ Return clean/infected result │
└─────────────────────────────────┘
     │
     ▼
 clean? → persist to storage
 infected? → reject upload + quarantine
```

## Quick Start

### Basic Setup

```typescript
import { NoopScanner, scanFile } from '@gao/antivirus';

const result = await scanFile(
    { filePath: '/tmp/upload-123.pdf', originalName: 'report.pdf' },
    {
        scanners: [new NoopScanner()],
        fallbackMode: 'warn',
        quarantineDir: '/var/gao/quarantine',
    },
);

if (!result.clean) {
    console.error('Infected file detected!', result.results);
}
```

### Production Setup (ClamAV)

```typescript
import { ClamAVScanner, MultiScanner, scanFile } from '@gao/antivirus';

// Connect to ClamAV daemon
const clamav = new ClamAVScanner({
    host: '127.0.0.1', // or Docker container
    port: 3310,
    timeout: 10_000,
});

const scanner = new MultiScanner([clamav]);

const result = await scanFile(
    { filePath: '/tmp/upload.exe', originalName: 'installer.exe' },
    {
        scanners: [scanner],
        fallbackMode: 'strict',          // Reject if no scanner available
        quarantineDir: '/var/gao/quarantine',
        maxScanSizeBytes: 104_857_600,   // 100 MB
        onThreatDetected: async (threat, filename) => {
            await alertSecurityTeam(threat, filename);
        },
    },
);
```

### ClamAV with Docker

```bash
docker run -d --name clamav -p 3310:3310 clamav/clamav:latest
```

## Fallback Modes

| Mode | Behavior When No Scanner Available |
|------|------------------------------------|
| `strict` | **Throws error** — uploads are rejected entirely |
| `warn` | Logs warning, returns `clean: true` — file is accepted |
| `allow` | Silently returns `clean: true` — no logging |

> ⚠️ **Production should always use `strict` mode.**

## Components

| Module | Path | Description |
|--------|------|-------------|
| NoopScanner | `src/scanner/noop-scanner.ts` | Dev-only scanner (always clean) |
| ClamAVScanner | `src/scanner/clamav-scanner.ts` | ClamAV daemon integration |
| MultiScanner | `src/scanner/multi-scanner.ts` | Parallel multi-engine orchestrator |
| QuarantineManager | `src/quarantine/quarantine-manager.ts` | Infected file isolation + audit log |
| scanFile | `src/middleware/virus-scan.ts` | Core scan function (framework-agnostic) |

## Quarantine

Infected files are:
1. **Copied** to the quarantine directory with a UUID filename
2. **Deleted** from the original upload location
3. **Logged** in `quarantine-log.json` with metadata (original name, threats, timestamp, file hash)

```typescript
import { QuarantineManager } from '@gao/antivirus';

const manager = new QuarantineManager('/var/gao/quarantine');

// List quarantined files
const files = await manager.listQuarantined();

// Permanently delete a quarantined file
await manager.deleteQuarantined('quarantine-uuid-here');
```

## Tests

```bash
npx vitest run    # 16 tests
```

Covers: NoopScanner behavior, MultiScanner aggregation, QuarantineManager file isolation, scanFile function (clean/infected/strict/warn modes, alert callbacks, oversized file rejection).

## Dependencies

- **Required:** None (Node.js built-in `crypto`, `fs`, `path`, `os`, `stream`)
- **Optional:** `clamscan` — only needed when using `ClamAVScanner`

```bash
# Only install if using ClamAV
npm install clamscan
```
