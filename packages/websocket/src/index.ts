/**
 * @gao/websocket — Public API
 */

// ─── Core Classes ────────────────────────────────────────────
export { WebSocketServer, createWebSocketServer } from './server.js';
export { PresenceTracker, createPresenceTracker } from './presence.js';
export { ChannelManager, createChannelManager } from './channel.js';
export { createAuthMiddleware } from './auth.js';
export type { AuthenticatedSocket } from './auth.js';

// ─── Plugin ──────────────────────────────────────────────────
export { websocketPlugin } from './plugin.js';

// ─── Types ───────────────────────────────────────────────────
export type {
    WebSocketConfig,
    WebSocketCorsConfig,
    WebSocketRedisConfig,
    SocketUser,
    AuthVerifyFn,
    PresenceInfo,
    ChannelOptions,
} from './types.js';
