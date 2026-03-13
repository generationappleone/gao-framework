/**
 * @gao/websocket — Public API
 */

// ─── Core Classes ────────────────────────────────────────────
export { WebSocketServer, createWebSocketServer } from './server.js';
export { PresenceTracker, createPresenceTracker } from './presence.js';
export { ChannelManager, createChannelManager } from './channel.js';
export { createAuthMiddleware } from './auth.js';
export type { AuthenticatedSocket, AuthMiddlewareOptions } from './auth.js';

// ─── Security ────────────────────────────────────────────────
export { TicketStore } from './ticket.js';
export type { TicketPayload, TicketIssueResult } from './ticket.js';

export { WsRateLimiter } from './ws-rate-limiter.js';
export type { RateLimitResult } from './ws-rate-limiter.js';

export { ChannelGuard } from './channel-guard.js';
export type { ChannelAuthResult } from './channel-guard.js';

export { MessageValidator } from './message-validator.js';
export type { ValidationResult } from './message-validator.js';

export { ReAuthHandler } from './re-auth.js';

// ─── Plugin ──────────────────────────────────────────────────
export { websocketPlugin } from './plugin.js';

// ─── Types ───────────────────────────────────────────────────
export type {
    WebSocketConfig,
    WebSocketCorsConfig,
    WebSocketRedisConfig,
    WebSocketSecurityConfig,
    WsTicketConfig,
    WsRateLimitConfig,
    WsChannelRule,
    WsMessageValidationConfig,
    WsReAuthConfig,
    SocketUser,
    AuthVerifyFn,
    PresenceInfo,
    ChannelOptions,
} from './types.js';

