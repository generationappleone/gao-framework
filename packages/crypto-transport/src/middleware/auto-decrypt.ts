/**
 * @gao/crypto-transport — Auto-Decrypt Middleware
 *
 * Automatically decrypts incoming request bodies that are marked
 * with the X-GAO-Encrypted header.
 *
 * This middleware is TRANSPARENT to the application — the handler
 * receives plaintext as if no encryption exists.
 */

import type { SessionStore } from '../types.js';
import { E2EE_HEADERS } from '../types.js';
import { parseEnvelope, decryptEnvelope } from '../codec/envelope.js';

export interface DecryptMiddlewareContext {
    /** Raw request body (string) */
    rawBody: string;
    /** Request headers (get function) */
    getHeader: (name: string) => string | undefined;
    /** Set the decrypted body for downstream handlers */
    setDecryptedBody: (body: unknown) => void;
    /** Set the session ID for downstream use (e.g., auto-encrypt response) */
    setSessionId: (id: string) => void;
}

/**
 * Create auto-decrypt logic (framework-agnostic).
 *
 * @param store - Session store to look up encryption keys
 * @returns A function that processes an encrypted request
 */
export function createAutoDecrypt(store: SessionStore) {
    return async function autoDecrypt(ctx: DecryptMiddlewareContext): Promise<{ success: boolean; error?: string; statusCode?: number }> {
        const encrypted = ctx.getHeader(E2EE_HEADERS.ENCRYPTED);
        if (encrypted !== '1') {
            // Not encrypted — pass through
            return { success: true };
        }

        const sessionId = ctx.getHeader(E2EE_HEADERS.SESSION_ID);
        if (!sessionId) {
            return {
                success: false,
                error: 'Missing X-GAO-Session-ID header',
                statusCode: 400,
            };
        }

        // Look up the session
        const session = await store.get(sessionId);
        if (!session) {
            return {
                success: false,
                error: 'E2EE session expired or invalid',
                statusCode: 401,
            };
        }

        // Parse the encrypted envelope from the body
        let envelope;
        try {
            envelope = parseEnvelope(ctx.rawBody);
        } catch {
            return {
                success: false,
                error: 'Invalid encrypted envelope format',
                statusCode: 400,
            };
        }

        // ─── Replay protection: enforce monotonic sequence ────────
        if (envelope.seq <= session.lastSeq) {
            return {
                success: false,
                error: `Replay detected: seq ${envelope.seq} <= lastSeq ${session.lastSeq}`,
                statusCode: 409,
            };
        }

        // Decrypt the payload
        let plaintext: string;
        try {
            plaintext = decryptEnvelope(envelope, session.encryptionKey);
        } catch {
            return {
                success: false,
                error: 'Decryption failed — key mismatch or tampered data',
                statusCode: 401,
            };
        }

        // Parse the decrypted JSON and set it as the request body
        try {
            const parsed = JSON.parse(plaintext);
            ctx.setDecryptedBody(parsed);
        } catch {
            // Not JSON — set as raw string
            ctx.setDecryptedBody(plaintext);
        }

        ctx.setSessionId(sessionId);

        // Update sequence watermark and increment request counter
        session.lastSeq = envelope.seq;
        await store.set(session);
        await store.incrementRequestCount(sessionId);

        return { success: true };
    };
}
