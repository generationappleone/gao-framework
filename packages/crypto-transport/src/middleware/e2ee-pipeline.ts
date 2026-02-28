/**
 * @gao/crypto-transport — E2EE Pipeline
 *
 * Combines handshake, auto-decrypt, and auto-encrypt into a single
 * pipeline that can be integrated into the GAO HTTP server.
 *
 * This is the main entry point for applications that want to enable
 * transparent E2EE.
 */

import type { CryptoTransportConfig, SessionStore } from '../types.js';
import { MemorySessionStore } from '../handshake/session-store.js';
import { createHandshakeHandler } from '../handshake/handshake-handler.js';
import { createAutoDecrypt } from './auto-decrypt.js';
import { createAutoEncrypt } from './auto-encrypt.js';

/**
 * Creates a complete E2EE pipeline with all components configured.
 *
 * @param config - Pipeline configuration
 * @returns An object with all E2EE components ready to use
 */
export function createE2EEPipeline(config: CryptoTransportConfig = {}) {
    const store: SessionStore = config.sessionStore ?? new MemorySessionStore({
        ttlMs: config.sessionTtlMs ?? 86_400_000,
    });

    const handshakePath = config.handshakePath ?? '/gao/handshake';
    const excludePaths = config.excludePaths ?? [];
    const enforceEncryption = config.enforceEncryption ?? false;

    const handleHandshake = createHandshakeHandler(store, config);
    const autoDecrypt = createAutoDecrypt(store);
    const autoEncrypt = createAutoEncrypt(store);

    return {
        /** The session store used by this pipeline */
        store,
        /** Path for the handshake endpoint */
        handshakePath,
        /** Paths excluded from encryption */
        excludePaths,
        /** Whether to reject unencrypted requests */
        enforceEncryption,
        /** Process a handshake request */
        handleHandshake,
        /** Decrypt an incoming request */
        autoDecrypt,
        /** Encrypt an outgoing response */
        autoEncrypt,

        /**
         * Check if a request path should be processed by the E2EE pipeline.
         * Returns false for excluded paths and the handshake path itself.
         */
        shouldProcess(path: string): boolean {
            if (path === handshakePath) return false;
            if (excludePaths.some(p => path.startsWith(p))) return false;
            return true;
        },
    };
}

export type E2EEPipeline = ReturnType<typeof createE2EEPipeline>;
