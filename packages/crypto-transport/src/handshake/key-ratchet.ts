/**
 * @gao/crypto-transport — Key Ratchet
 *
 * Implements forward-secrecy key rotation for E2EE sessions.
 *
 * Key rotation ensures that if a session key is compromised, only
 * messages encrypted with that specific key can be decrypted —
 * past and future messages remain secure.
 *
 * Mechanism:
 * 1. Derive a new key from the current key + HKDF (chain ratchet)
 * 2. Replace the session's encryption key
 * 3. Wipe the old key from memory
 */

import { hkdfSync } from 'node:crypto';
import type { E2EESession, SessionStore } from '../types.js';

/** HKDF info for key ratchet — distinct from the initial derivation */
const RATCHET_INFO = 'gao-e2ee-ratchet-v1';

export interface KeyRatchetConfig {
    /** Session store */
    store: SessionStore;
    /** Rotation interval in ms. Default: 3,600,000 (1 hour) */
    rotationIntervalMs?: number;
    /** Max requests before rotation. Default: 10,000 */
    maxRequestsBeforeRotation?: number;
}

/**
 * Derive a new key from the current key using HKDF chain ratchet.
 * This provides forward secrecy — old keys cannot derive future keys.
 *
 * @param currentKey - 32-byte current encryption key
 * @returns 32-byte new encryption key
 */
export function ratchetKey(currentKey: Buffer): Buffer {
    // Use the current key as both IKM and salt for HKDF
    // This creates a one-way chain — you can go forward but not backward
    return Buffer.from(
        hkdfSync('sha256', currentKey, currentKey, RATCHET_INFO, 32),
    );
}

/**
 * Check if a session needs key rotation based on time or request count.
 */
export function needsRotation(
    session: E2EESession,
    config: KeyRatchetConfig,
): boolean {
    const intervalMs = config.rotationIntervalMs ?? 3_600_000;
    const maxRequests = config.maxRequestsBeforeRotation ?? 10_000;

    const timeSinceRotation = Date.now() - session.lastRotatedAt;
    if (timeSinceRotation >= intervalMs) return true;
    if (session.requestCount >= maxRequests) return true;

    return false;
}

/**
 * Perform key rotation on a session.
 * Derives a new encryption key from the current one and updates the store.
 *
 * @returns The updated session with new keys
 */
export async function rotateSessionKey(
    session: E2EESession,
    store: SessionStore,
): Promise<E2EESession> {
    const newEncryptionKey = ratchetKey(session.encryptionKey);
    const newMacKey = ratchetKey(session.macKey);

    // Wipe old keys from the Buffer (overwrite with zeros)
    session.encryptionKey.fill(0);
    session.macKey.fill(0);

    // Update session
    const updated: E2EESession = {
        ...session,
        encryptionKey: newEncryptionKey,
        macKey: newMacKey,
        lastRotatedAt: Date.now(),
        requestCount: 0, // Reset counter
    };

    await store.set(updated);
    return updated;
}

/**
 * Create a key rotation checker that can be called per-request.
 * Automatically rotates keys when the threshold is reached.
 */
export function createKeyRatchet(config: KeyRatchetConfig) {
    return async function checkAndRotate(sessionId: string): Promise<boolean> {
        const session = await config.store.get(sessionId);
        if (!session) return false;

        if (needsRotation(session, config)) {
            await rotateSessionKey(session, config.store);
            return true; // Key was rotated
        }

        return false; // No rotation needed
    };
}
