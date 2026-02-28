/**
 * @gao/crypto-transport — Types & Interfaces
 *
 * All type definitions for the transparent E2EE system.
 */

// ─── Key Exchange ────────────────────────────────────────────

/**
 * An X25519 ECDH key pair used for the handshake.
 */
export interface KeyPair {
    /** Raw 32-byte X25519 public key */
    publicKey: Buffer;
    /** Raw 32-byte X25519 private key */
    privateKey: Buffer;
}

/**
 * Keys derived from the ECDH shared secret via HKDF-SHA256.
 */
export interface DerivedKeys {
    /** 32-byte key for AES-256-GCM encryption */
    encryptionKey: Buffer;
    /** 32-byte key for HMAC verification (integrity) */
    macKey: Buffer;
}

// ─── Session ─────────────────────────────────────────────────

/**
 * Represents an active E2EE session between client and server.
 */
export interface E2EESession {
    /** Unique session identifier (UUID v4) */
    sessionId: string;
    /** Current AES-256-GCM encryption key */
    encryptionKey: Buffer;
    /** Current HMAC key for integrity verification */
    macKey: Buffer;
    /** Timestamp when session was created (ms since epoch) */
    createdAt: number;
    /** Number of requests processed in this session */
    requestCount: number;
    /** Timestamp of last key rotation (ms since epoch) */
    lastRotatedAt: number;
    /** Last accepted sequence number — prevents replay attacks */
    lastSeq: number;
    /** Client's X25519 public key */
    clientPublicKey: Buffer;
    /** Server's X25519 public key for this session */
    serverPublicKey: Buffer;
    /** Server's X25519 private key for this session */
    serverPrivateKey: Buffer;
}

/**
 * Interface for session storage backends.
 * Supports both in-memory (development) and Redis (production).
 */
export interface SessionStore {
    /** Retrieve a session by ID */
    get(sessionId: string): Promise<E2EESession | null>;
    /** Store or update a session */
    set(session: E2EESession): Promise<void>;
    /** Delete a session */
    delete(sessionId: string): Promise<void>;
    /** Increment the request counter and return the new value */
    incrementRequestCount(sessionId: string): Promise<number>;
}

// ─── Envelope ────────────────────────────────────────────────

/**
 * The encrypted envelope transmitted over the wire.
 * Format: JSON with base64url-encoded binary fields.
 */
export interface EncryptedEnvelope {
    /** 12-byte initialization vector (base64url) */
    iv: string;
    /** 16-byte authentication tag (base64url) */
    tag: string;
    /** Encrypted payload (base64url) */
    data: string;
    /** Monotonically increasing counter to prevent replay attacks */
    seq: number;
}

// ─── Configuration ───────────────────────────────────────────

/**
 * Configuration for the E2EE transport layer.
 */
export interface CryptoTransportConfig {
    /** Enable or disable E2EE. Default: true */
    enabled?: boolean;
    /** Session store implementation. Default: MemorySessionStore */
    sessionStore?: SessionStore;
    /** Key rotation interval in milliseconds. Default: 3600000 (1 hour) */
    keyRotationIntervalMs?: number;
    /** Max requests before forced key rotation. Default: 10000 */
    maxRequestsBeforeRotation?: number;
    /** Session TTL in milliseconds. Default: 86400000 (24 hours) */
    sessionTtlMs?: number;
    /** Paths to exclude from encryption (e.g., health checks, static files) */
    excludePaths?: string[];
    /** Handshake endpoint path. Default: '/gao/handshake' */
    handshakePath?: string;
    /** Enforce encryption — reject unencrypted requests. Default: false */
    enforceEncryption?: boolean;
}

// ─── Handshake ───────────────────────────────────────────────

/**
 * Client's handshake request payload.
 */
export interface HandshakeRequest {
    /** Client's X25519 public key (base64url) */
    clientPublicKey: string;
}

/**
 * Server's handshake response payload.
 */
export interface HandshakeResponse {
    /** Unique session ID for this E2EE session */
    sessionId: string;
    /** Server's X25519 public key (base64url) */
    serverPublicKey: string;
    /** Key rotation interval in ms — client should re-handshake before this */
    rotationIntervalMs: number;
}

// ─── Middleware ───────────────────────────────────────────────

/**
 * Headers used by the E2EE transport system.
 */
export const E2EE_HEADERS = {
    /** Indicates the request/response body is encrypted */
    ENCRYPTED: 'x-gao-encrypted',
    /** The session ID for key lookup */
    SESSION_ID: 'x-gao-session-id',
    /** Sequence number for replay attack prevention */
    SEQUENCE: 'x-gao-seq',
} as const;
