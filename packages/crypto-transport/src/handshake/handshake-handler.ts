/**
 * @gao/crypto-transport — Handshake Handler
 *
 * Provides the GET /gao/handshake endpoint that performs
 * ECDH key exchange between client and server.
 *
 * Protocol:
 * 1. Client POST /gao/handshake with { clientPublicKey: "<base64url>" }
 * 2. Server generates its own X25519 key pair
 * 3. Server derives shared keys using ECDH
 * 4. Server stores the session (sessionId → keys)
 * 5. Server responds with { sessionId, serverPublicKey, rotationIntervalMs }
 * 6. Client derives the same shared keys using server's public key
 * 7. Both sides now have identical AES-256-GCM keys
 */

import { randomUUID } from 'node:crypto';
import {
    generateKeyPair,
    deriveSharedKeys,
    encodePublicKey,
    decodePublicKey,
} from './ecdh.js';
import type {
    CryptoTransportConfig,
    E2EESession,
    HandshakeRequest,
    HandshakeResponse,
    SessionStore,
} from '../types.js';

/**
 * Create a handshake handler function.
 *
 * @param store  - Session store to persist E2EE sessions
 * @param config - Transport configuration
 * @returns An async function that processes handshake requests
 */
export function createHandshakeHandler(
    store: SessionStore,
    config: CryptoTransportConfig = {},
) {
    const rotationIntervalMs = config.keyRotationIntervalMs ?? 3_600_000; // 1 hour

    /**
     * Process a handshake request and establish an E2EE session.
     *
     * @param requestBody - The parsed JSON body from the client
     * @returns HandshakeResponse to send back to the client
     * @throws Error if the client public key is invalid
     */
    return async function handleHandshake(
        requestBody: HandshakeRequest,
    ): Promise<HandshakeResponse> {
        // Validate client's public key
        if (!requestBody.clientPublicKey || typeof requestBody.clientPublicKey !== 'string') {
            throw new Error('Missing or invalid clientPublicKey');
        }

        const clientPublicKey = decodePublicKey(requestBody.clientPublicKey);

        // Generate server's ephemeral key pair for this session
        const serverKeyPair = generateKeyPair();

        // Derive shared keys via ECDH + HKDF
        const derivedKeys = deriveSharedKeys(serverKeyPair.privateKey, clientPublicKey);

        // Create session
        const sessionId = randomUUID();
        const now = Date.now();

        const session: E2EESession = {
            sessionId,
            encryptionKey: derivedKeys.encryptionKey,
            macKey: derivedKeys.macKey,
            createdAt: now,
            requestCount: 0,
            lastRotatedAt: now,
            lastSeq: 0,
            clientPublicKey,
            serverPublicKey: serverKeyPair.publicKey,
            serverPrivateKey: serverKeyPair.privateKey,
        };

        await store.set(session);

        // Return the server's public key so the client can derive the same shared keys
        return {
            sessionId,
            serverPublicKey: encodePublicKey(serverKeyPair.publicKey),
            rotationIntervalMs,
        };
    };
}
