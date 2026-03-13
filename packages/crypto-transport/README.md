# @gao/crypto-transport

Transparent End-to-End Encryption (E2EE) transport layer for the GAO Framework. Provides automatic request/response encryption between client and server using modern cryptographic standards — **zero external dependencies**, all operations use Node.js built-in `crypto` module.

## Features

-   **X25519 ECDH Key Exchange** — Elliptic Curve Diffie-Hellman for secure session establishment.
-   **AES-256-GCM Envelope Encryption** — Authenticated encryption with Associated Data (AEAD) for all payloads.
-   **HKDF-SHA256 Key Derivation** — Standards-compliant key expansion from shared secrets.
-   **Forward Secrecy via Key Ratchet** — HKDF chain ratchet rotates keys automatically (time-based + request-count triggers).
-   **Replay Attack Prevention** — Monotonic sequence counters bound as AAD; server enforces `seq > lastSeq`.
-   **Transparent Middleware** — Auto-decrypt incoming requests, auto-encrypt outgoing responses. Application handlers see plaintext.
-   **Framework-Agnostic** — Context interfaces allow integration with any HTTP framework (Express, Fastify, @gao/http, etc.).
-   **Browser Client SDK** — Web Crypto API-based client for browser-to-server E2EE.
-   **Production Session Store** — Redis-backed store with atomic `INCR` counters for multi-process deployments.

## Architecture

```
Client (Browser)                          Server (@gao/http)
┌──────────────────┐                      ┌──────────────────────────┐
│  GaoE2EE SDK     │                      │  E2EE Pipeline           │
│  (Web Crypto)    │                      │                          │
│  ① Generate X25519│──── Handshake ────→ │  ① Generate X25519       │
│  ② Receive pubkey│←─── Response ────── │  ② ECDH → shared secret  │
│  ③ ECDH derive   │                      │  ③ HKDF → enc + mac keys│
│  ④ AES-GCM enc   │──── Encrypted ────→ │  ④ Auto-Decrypt          │
│  ⑤ AES-GCM dec   │←─── Encrypted ────  │  ⑤ Auto-Encrypt          │
└──────────────────┘                      └──────────────────────────┘
```

## Quick Start

### Server-Side (Node.js)

```typescript
import { createE2EEPipeline } from '@gao/crypto-transport';

// Create pipeline with defaults (in-memory session store, 1h rotation)
const e2ee = createE2EEPipeline({
    sessionTtlMs: 86_400_000,        // 24 hours
    keyRotationIntervalMs: 3_600_000, // 1 hour
    excludePaths: ['/health', '/static/'],
    enforceEncryption: false,
});

// Handshake endpoint
app.post(e2ee.handshakePath, async (req, res) => {
    const result = await e2ee.handleHandshake(req.body);
    res.json(result);
});

// Middleware: decrypt incoming → process → encrypt outgoing
app.use(async (req, res, next) => {
    if (!e2ee.shouldProcess(req.path)) return next();

    const decryptResult = await e2ee.autoDecrypt({
        rawBody: req.body,
        getHeader: (name) => req.headers[name],
        setDecryptedBody: (body) => { req.body = body; },
        setSessionId: (id) => { req.sessionId = id; },
    });

    if (!decryptResult.success) {
        return res.status(decryptResult.statusCode).json({ error: decryptResult.error });
    }

    await next();

    await e2ee.autoEncrypt({
        sessionId: req.sessionId,
        responseBody: JSON.stringify(res.body),
        setEncryptedBody: (body) => { res.body = body; },
        setHeader: (name, value) => res.setHeader(name, value),
    });
});
```

### Client-Side (Browser)

```typescript
import { GaoE2EE } from '@gao/crypto-transport/client';

const e2ee = new GaoE2EE({
    baseUrl: 'https://api.example.com',
    autoRenew: true,
});

// Initialize E2EE session (performs ECDH handshake)
await e2ee.initialize();

// All requests are automatically encrypted/decrypted
const response = await e2ee.fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' }),
});

const data = await response.json(); // Decrypted transparently
```

### Production Setup (Redis Store)

```typescript
import { createE2EEPipeline, RedisSessionStore } from '@gao/crypto-transport';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const store = new RedisSessionStore(redis, { ttlMs: 86_400_000 });

const e2ee = createE2EEPipeline({
    sessionStore: store,
});
```

## Security Properties

| Property | Implementation |
|----------|---------------|
| Key Exchange | X25519 ECDH — 128-bit security level |
| Encryption | AES-256-GCM — NIST-approved AEAD |
| Key Derivation | HKDF-SHA256 with protocol-bound info string |
| Forward Secrecy | HKDF chain ratchet (one-way derivation) |
| Replay Protection | Monotonic sequence counters + server-side enforcement |
| Tamper Detection | GCM authentication tag (128-bit) |
| Key Wiping | `Buffer.fill(0)` on rotation / session destroy |

## Components

| Module | Path | Description |
|--------|------|-------------|
| ECDH | `src/handshake/ecdh.ts` | X25519 key generation, shared secret, HKDF derivation |
| Envelope | `src/codec/envelope.ts` | AES-256-GCM encrypt/decrypt with AAD binding |
| Session Store | `src/handshake/session-store.ts` | In-memory store (dev) |
| Redis Store | `src/handshake/redis-session-store.ts` | Redis store with atomic INCR (prod) |
| Key Ratchet | `src/handshake/key-ratchet.ts` | Forward-secrecy key rotation |
| Auto-Decrypt | `src/middleware/auto-decrypt.ts` | Transparent request decryption |
| Auto-Encrypt | `src/middleware/auto-encrypt.ts` | Transparent response encryption |
| Pipeline | `src/middleware/e2ee-pipeline.ts` | Combined E2EE middleware factory |
| Client SDK | `src/client/sdk.ts` | Browser Web Crypto API client |

## Tests

```bash
npx vitest run    # 61 tests
```

Covers: ECDH key exchange, envelope encryption/decryption, session management, key ratchet, middleware pipeline, replay protection, Redis session store, and full end-to-end round-trips.

## Zero External Dependencies

All cryptographic operations use Node.js built-in `crypto` module:
- `generateKeyPairSync('x25519')` — Key generation
- `diffieHellman()` — ECDH shared secret
- `hkdfSync()` — Key derivation
- `createCipheriv('aes-256-gcm')` — Encryption
- `createDecipheriv('aes-256-gcm')` — Decryption

Client SDK uses the Web Crypto API (`SubtleCrypto`).
