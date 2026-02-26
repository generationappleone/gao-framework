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
