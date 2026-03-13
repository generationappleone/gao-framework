/**
 * @gao/websocket — Message Payload Validator
 *
 * Validates incoming WebSocket event payloads against:
 *   1. Size limits (prevents memory exhaustion)
 *   2. String sanitization (prevents XSS via stored payloads)
 *
 * This runs BEFORE any application event handler, rejecting
 * oversized or malicious payloads at the transport layer.
 *
 * All validation is synchronous for minimal latency impact.
 */

import type { WsMessageValidationConfig } from './types.js';

// ─── Result Type ──────────────────────────────────────────────

export interface ValidationResult<T = unknown> {
    /** Whether the payload passed validation. */
    readonly valid: boolean;
    /** The (possibly sanitized) data. */
    readonly data: T;
    /** Human-readable rejection reason (only when valid=false). */
    readonly reason?: string;
}

// ─── HTML Entity Map for XSS Prevention ───────────────────────

const HTML_ENTITY_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
};

// ─── MessageValidator ─────────────────────────────────────────

export class MessageValidator {
    private readonly maxBytes: number;
    private readonly sanitize: boolean;

    constructor(config: WsMessageValidationConfig = {}) {
        this.maxBytes = config.maxPayloadBytes ?? 65_536; // 64 KB
        this.sanitize = config.sanitizeStrings ?? true;
    }

    /**
     * Validate a message payload.
     *
     * Returns a result with the (possibly sanitized) data.
     * If validation fails, `valid` is false and `reason` explains why.
     */
    validate<T>(data: T): ValidationResult<T> {
        // ── Size check ───────────────────────────────────────
        const serialized = JSON.stringify(data);
        const estimatedBytes = serialized.length * 2; // UTF-16 rough estimate

        if (estimatedBytes > this.maxBytes) {
            return {
                valid: false,
                data,
                reason: `Payload too large: ~${estimatedBytes} bytes exceeds limit of ${this.maxBytes} bytes`,
            };
        }

        // ── String sanitization ──────────────────────────────
        if (this.sanitize) {
            const sanitized = this.sanitizeDeep(data) as T;
            return { valid: true, data: sanitized };
        }

        return { valid: true, data };
    }

    /**
     * Recursively sanitize all string values in a data structure.
     * Encodes HTML special characters to prevent XSS.
     */
    private sanitizeDeep(value: unknown): unknown {
        if (value === null || value === undefined) {
            return value;
        }

        if (typeof value === 'string') {
            return this.encodeHtml(value);
        }

        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeDeep(item));
        }

        if (typeof value === 'object') {
            const result: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
                result[key] = this.sanitizeDeep(val);
            }
            return result;
        }

        // Primitives (number, boolean) pass through unchanged
        return value;
    }

    /**
     * Encode HTML special characters in a string.
     */
    private encodeHtml(str: string): string {
        return str.replace(/[&<>"']/g, (char) => HTML_ENTITY_MAP[char] ?? char);
    }
}
