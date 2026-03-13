/**
 * @gao/websocket — Type Definitions
 */

// ─── Config ──────────────────────────────────────────────────

export interface WebSocketCorsConfig {
    readonly origins: string[];
    readonly credentials?: boolean;
}

export interface WebSocketRedisConfig {
    readonly url: string;
}

export interface WebSocketConfig {
    readonly enabled: boolean;
    readonly path?: string;
    readonly cors?: WebSocketCorsConfig;
    readonly pingInterval?: number;
    readonly pingTimeout?: number;
    readonly maxBufferSize?: number;
    readonly redis?: WebSocketRedisConfig;
    /** Security configuration. All layers enabled by default. */
    readonly security?: WebSocketSecurityConfig;
}

// ─── Auth ────────────────────────────────────────────────────

export interface SocketUser {
    readonly id: string;
    readonly [key: string]: unknown;
}

export type AuthVerifyFn = (token: string) => Promise<SocketUser | null> | SocketUser | null;

// ─── Presence ────────────────────────────────────────────────

export interface PresenceInfo {
    readonly userId: string;
    readonly socketId: string;
    readonly connectedAt: number;
    readonly metadata?: Record<string, unknown>;
}

// ─── Channel ─────────────────────────────────────────────────

export interface ChannelOptions {
    readonly requireAuth?: boolean;
    readonly maxMembers?: number;
}

// ─── Security: Ticket-Based Handshake ─────────────────────────

export interface WsTicketConfig {
    /** Enable ticket-based handshake. Default: true */
    readonly enabled?: boolean;
    /** Ticket validity in seconds. Default: 30 */
    readonly ttlSeconds?: number;
    /** Bind ticket to requester IP. Default: true */
    readonly bindToIp?: boolean;
}

// ─── Security: Connection Rate Limiting ───────────────────────

export interface WsRateLimitConfig {
    /** Max new connections per IP within window. Default: 10 */
    readonly maxConnectionsPerIp?: number;
    /** Rate limit window in ms. Default: 10000 (10s) */
    readonly windowMs?: number;
    /** Max concurrent connections per authenticated user. Default: 5 */
    readonly maxConnectionsPerUser?: number;
    /** Block IP after N consecutive auth failures. Default: 20 */
    readonly blockAfterFailures?: number;
    /** Block duration in ms after threshold. Default: 300000 (5min) */
    readonly blockDurationMs?: number;
}

// ─── Security: Channel Authorization ──────────────────────────

export interface WsChannelRule {
    /** Require authenticated user. Default: false */
    readonly requireAuth?: boolean;
    /** Required roles (user must have at least one). */
    readonly requiredRoles?: string[];
    /** Only the user whose ID matches the {id} placeholder can join. */
    readonly ownerOnly?: boolean;
    /** Broadcast presence events on join/leave. */
    readonly broadcastPresence?: boolean;
    /** Max members override for this channel pattern. */
    readonly maxMembers?: number;
}

// ─── Security: Message Payload Validation ─────────────────────

export interface WsMessageValidationConfig {
    /** Max payload size in bytes. Default: 65536 (64KB) */
    readonly maxPayloadBytes?: number;
    /** Sanitize string fields to prevent XSS. Default: true */
    readonly sanitizeStrings?: boolean;
}

// ─── Security: Periodic Re-Authentication ─────────────────────

export interface WsReAuthConfig {
    /** Enable periodic re-authentication. Default: true */
    readonly enabled?: boolean;
    /** Interval in minutes between re-auth requests. Default: 30 */
    readonly intervalMinutes?: number;
    /** Grace period in seconds to provide new token. Default: 30 */
    readonly gracePeriodSeconds?: number;
}

// ─── Security: Master Config ──────────────────────────────────

export interface WebSocketSecurityConfig {
    /** Ticket-based handshake (replaces token-in-URL). */
    readonly ticket?: WsTicketConfig;
    /** Connection rate limiting. */
    readonly rateLimit?: WsRateLimitConfig;
    /** Channel authorization rules by prefix pattern. */
    readonly channels?: Record<string, WsChannelRule>;
    /** Message payload validation. */
    readonly messageValidation?: WsMessageValidationConfig;
    /** Periodic re-authentication. */
    readonly reAuth?: WsReAuthConfig;
    /** Allow token via query string (INSECURE — disabled by default). */
    readonly allowQueryToken?: boolean;
}
