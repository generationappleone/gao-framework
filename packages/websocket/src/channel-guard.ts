/**
 * @gao/websocket — Channel Authorization Guard
 *
 * Enforces access control on WebSocket channels using pattern matching.
 * Channels that match a defined rule are checked against the rule's
 * requirements; channels with no matching rule are allowed by default
 * (open channels).
 *
 * Pattern syntax:
 *   'private-*'   → matches "private-chat", "private-123"
 *   'admin-*'     → matches "admin-dashboard", "admin-logs"
 *   'user-{id}'   → matches "user-abc123", captures "abc123" as {id}
 *   'exact-name'  → matches only "exact-name"
 *
 * Rule properties:
 *   - requireAuth:       user must be authenticated
 *   - requiredRoles:     user must have at least one of the listed roles
 *   - ownerOnly:         user.id must match the {id} capture group
 *   - broadcastPresence: presence events are emitted on join/leave
 *   - maxMembers:        maximum members allowed in the channel
 */

import type { WsChannelRule, SocketUser } from './types.js';

// ─── Result Type ──────────────────────────────────────────────

export interface ChannelAuthResult {
    /** Whether the user is allowed to join. */
    readonly allowed: boolean;
    /** Human-readable denial reason. */
    readonly reason?: string;
    /** The matched rule (if any). */
    readonly rule?: WsChannelRule;
}

// ─── Internal Compiled Rule ───────────────────────────────────

interface CompiledRule {
    readonly pattern: RegExp;
    readonly paramName: string | undefined;
    readonly rule: WsChannelRule;
}

// ─── ChannelGuard ─────────────────────────────────────────────

export class ChannelGuard {
    private readonly rules: CompiledRule[];

    /**
     * @param channelRules - Map of channel patterns to their access rules.
     */
    constructor(channelRules: Record<string, WsChannelRule> = {}) {
        this.rules = Object.entries(channelRules).map(([pattern, rule]) => {
            return compilePattern(pattern, rule);
        });
    }

    /**
     * Check if a user is authorized to join a channel.
     *
     * @param channelName - The channel the user wants to join.
     * @param user - The authenticated user (or undefined for anonymous).
     * @returns Authorization result with reason if denied.
     */
    authorize(channelName: string, user: SocketUser | undefined): ChannelAuthResult {
        for (const { pattern, paramName, rule } of this.rules) {
            const match = channelName.match(pattern);
            if (!match) continue;

            // ── Auth required ────────────────────────────────
            if (rule.requireAuth && !user) {
                return { allowed: false, reason: 'Authentication required', rule };
            }

            // ── Role check ───────────────────────────────────
            if (rule.requiredRoles && rule.requiredRoles.length > 0) {
                if (!user) {
                    return { allowed: false, reason: 'Authentication required for role check', rule };
                }

                const userRoles = extractRoles(user);
                const hasRole = rule.requiredRoles.some((r) => userRoles.includes(r));
                if (!hasRole) {
                    return { allowed: false, reason: 'Insufficient permissions', rule };
                }
            }

            // ── Owner-only check ─────────────────────────────
            if (rule.ownerOnly && paramName) {
                if (!user) {
                    return { allowed: false, reason: 'Authentication required for owner check', rule };
                }

                const capturedValue = match[1];
                if (capturedValue !== user.id) {
                    return { allowed: false, reason: 'Access denied — not the owner', rule };
                }
            }

            // All checks passed for this rule
            return { allowed: true, rule };
        }

        // No matching rule → allow by default (open channel)
        return { allowed: true };
    }

    /** Get the number of compiled rules. */
    get ruleCount(): number {
        return this.rules.length;
    }
}

// ─── Helper Functions ─────────────────────────────────────────

/**
 * Compile a channel pattern string into a RegExp with optional param capture.
 */
function compilePattern(patternStr: string, rule: WsChannelRule): CompiledRule {
    // Extract {paramName} if present
    const paramMatch = patternStr.match(/\{(\w+)\}/);
    const paramName = paramMatch?.[1];

    // Escape regex special characters first
    let regexStr = patternStr.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

    // Replace escaped \{paramName\} with a capture group
    regexStr = regexStr.replace(/\\\{(\w+)\\\}/g, '([^/]+)');

    // Replace * with wildcard (must be after escape to avoid double-escaping)
    regexStr = regexStr.replace(/\*/g, '.*');

    return {
        pattern: new RegExp(`^${regexStr}$`),
        paramName,
        rule,
    };
}

/**
 * Extract roles array from a SocketUser, handling various formats.
 */
function extractRoles(user: SocketUser): string[] {
    if (!user.roles) return [];
    if (Array.isArray(user.roles)) return user.roles as string[];
    if (typeof user.roles === 'string') return [user.roles];
    return [];
}
