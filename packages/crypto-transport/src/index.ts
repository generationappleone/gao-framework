/**
 * @gao/crypto-transport — Public API
 *
 * Transparent End-to-End Encryption for GAO Framework.
 * Encrypts all client↔server communication automatically without
 * programmer intervention.
 */

// ─── Types ───────────────────────────────────────────────────
export type {
    KeyPair,
    DerivedKeys,
    E2EESession,
    SessionStore,
    EncryptedEnvelope,
    CryptoTransportConfig,
    HandshakeRequest,
    HandshakeResponse,
} from './types.js';
export { E2EE_HEADERS } from './types.js';

// ─── Key Exchange ────────────────────────────────────────────
export {
    generateKeyPair,
    deriveSharedKeys,
    encodePublicKey,
    decodePublicKey,
} from './handshake/ecdh.js';

// ─── Session Store ───────────────────────────────────────────
export { MemorySessionStore } from './handshake/session-store.js';
export { RedisSessionStore } from './handshake/redis-session-store.js';
export type { RedisClient } from './handshake/redis-session-store.js';

// ─── Handshake ───────────────────────────────────────────────
export { createHandshakeHandler } from './handshake/handshake-handler.js';

// ─── Key Ratchet ─────────────────────────────────────────────
export {
    ratchetKey,
    needsRotation,
    rotateSessionKey,
    createKeyRatchet,
} from './handshake/key-ratchet.js';
export type { KeyRatchetConfig } from './handshake/key-ratchet.js';

// ─── Envelope Codec ──────────────────────────────────────────
export {
    encryptEnvelope,
    decryptEnvelope,
    serializeEnvelope,
    parseEnvelope,
} from './codec/envelope.js';

// ─── Middleware ──────────────────────────────────────────────
export { createAutoDecrypt } from './middleware/auto-decrypt.js';
export type { DecryptMiddlewareContext } from './middleware/auto-decrypt.js';
export { createAutoEncrypt } from './middleware/auto-encrypt.js';
export type { EncryptMiddlewareContext } from './middleware/auto-encrypt.js';
export { createE2EEPipeline } from './middleware/e2ee-pipeline.js';
export type { E2EEPipeline } from './middleware/e2ee-pipeline.js';


// NOTE: Client SDK (@gao/crypto-transport/client) is a separate entry point
// compiled with DOM lib. Import from '@gao/crypto-transport/client' directly.

