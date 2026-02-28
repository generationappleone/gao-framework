/**
 * @gao/crypto-transport — Auto-Encrypt Middleware
 *
 * Automatically encrypts outgoing response bodies when the request
 * was part of an active E2EE session.
 *
 * This middleware is TRANSPARENT to the application — the handler
 * returns plaintext and the middleware encrypts it before sending.
 */

import type { SessionStore } from '../types.js';
import { E2EE_HEADERS } from '../types.js';
import { encryptEnvelope, serializeEnvelope } from '../codec/envelope.js';

export interface EncryptMiddlewareContext {
    /** The session ID from the decrypted request (set by auto-decrypt) */
    sessionId: string | undefined;
    /** The plaintext response body to encrypt */
    responseBody: string;
    /** Set the encrypted response body */
    setEncryptedBody: (body: string) => void;
    /** Set response header */
    setHeader: (name: string, value: string) => void;
}

/**
 * Create auto-encrypt logic (framework-agnostic).
 *
 * @param store - Session store to look up encryption keys
 * @returns A function that encrypts the response body
 */
export function createAutoEncrypt(store: SessionStore) {
    return async function autoEncrypt(ctx: EncryptMiddlewareContext): Promise<boolean> {
        // No session — do not encrypt
        if (!ctx.sessionId) return false;

        const session = await store.get(ctx.sessionId);
        if (!session) return false;

        // Encrypt the response body
        const envelope = encryptEnvelope(
            ctx.responseBody,
            session.encryptionKey,
            session.requestCount, // Use request count as sequence
        );

        const serialized = serializeEnvelope(envelope);
        ctx.setEncryptedBody(serialized);
        ctx.setHeader(E2EE_HEADERS.ENCRYPTED, '1');
        ctx.setHeader('content-type', 'application/json');

        return true;
    };
}
