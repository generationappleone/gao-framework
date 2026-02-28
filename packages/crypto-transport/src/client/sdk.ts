/**
 * @gao/crypto-transport — Client SDK
 *
 * Browser-side E2EE SDK that automatically:
 * 1. Performs ECDH handshake with the server
 * 2. Encrypts outgoing request bodies
 * 3. Decrypts incoming response bodies
 *
 * The SDK uses the Web Crypto API (SubtleCrypto) for all cryptographic operations.
 *
 * Usage:
 *   import { GaoE2EE } from '@gao/crypto-transport/client';
 *   const e2ee = new GaoE2EE({ baseUrl: 'https://api.example.com' });
 *   await e2ee.initialize();
 *   // All subsequent fetch() calls through e2ee.fetch() are auto-encrypted
 */

/** Encrypted envelope format matching the server-side format */
interface EncryptedEnvelope {
    iv: string;
    tag: string;
    data: string;
    seq: number;
}

interface HandshakeResponse {
    sessionId: string;
    serverPublicKey: string;
    rotationIntervalMs: number;
}

export interface GaoE2EEConfig {
    /** Base URL of the GAO server. E.g., 'https://api.example.com' */
    baseUrl: string;
    /** Handshake endpoint path. Default: '/gao/handshake' */
    handshakePath?: string;
    /** Auto-renew session before expiry. Default: true */
    autoRenew?: boolean;
}

/**
 * GaoE2EE — Browser-side E2EE client.
 *
 * Uses Web Crypto API (SubtleCrypto) for X25519/AES-256-GCM operations.
 */
export class GaoE2EE {
    private config: Required<GaoE2EEConfig>;
    private sessionId: string | null = null;
    private encryptionKey: CryptoKey | null = null;
    private rawEncryptionKey: ArrayBuffer | null = null;
    private sequenceCounter = 0;
    private renewTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(config: GaoE2EEConfig) {
        this.config = {
            baseUrl: config.baseUrl.replace(/\/$/, ''),
            handshakePath: config.handshakePath ?? '/gao/handshake',
            autoRenew: config.autoRenew ?? true,
        };
    }

    /**
     * Initialize the E2EE session by performing an ECDH handshake.
     * Must be called before any encrypted communication.
     */
    async initialize(): Promise<void> {
        // Step 1: Generate client X25519 key pair
        const clientKeyPair = await crypto.subtle.generateKey(
            { name: 'X25519' },
            true,
            ['deriveBits'],
        ) as CryptoKeyPair;

        // Export client public key as raw bytes
        const clientPubRaw = await crypto.subtle.exportKey('raw', clientKeyPair.publicKey);
        const clientPubB64 = this.bufferToBase64Url(clientPubRaw);

        // Step 2: Handshake with server
        const url = `${this.config.baseUrl}${this.config.handshakePath}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientPublicKey: clientPubB64 }),
        });

        if (!resp.ok) {
            throw new Error(`E2EE handshake failed: ${resp.status} ${resp.statusText}`);
        }

        const handshakeResp: HandshakeResponse = await resp.json();
        this.sessionId = handshakeResp.sessionId;

        // Step 3: Import server's public key and derive shared secret
        const serverPubRaw = this.base64UrlToBuffer(handshakeResp.serverPublicKey);
        const serverPubKey = await crypto.subtle.importKey(
            'raw',
            serverPubRaw,
            { name: 'X25519' },
            false,
            [],
        );

        // Derive shared bits via X25519 ECDH
        const sharedBits = await crypto.subtle.deriveBits(
            { name: 'X25519', public: serverPubKey },
            clientKeyPair.privateKey,
            256,
        );

        // Step 4: HKDF to expand shared secret — MUST produce 512 bits (64 bytes)
        // to match server-side: encryptionKey (32B) + macKey (32B)
        const sharedKeyMaterial = await crypto.subtle.importKey(
            'raw',
            sharedBits,
            'HKDF',
            false,
            ['deriveBits'],
        );

        // Derive 64 bytes (512 bits) — same as server's TOTAL_KEY_MATERIAL
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'HKDF',
                hash: 'SHA-256',
                salt: new Uint8Array(32), // Fixed salt — matches server
                info: new TextEncoder().encode('gao-e2ee-v1'),
            },
            sharedKeyMaterial,
            512, // 64 bytes = encryptionKey(32) + macKey(32)
        );

        // Extract first 32 bytes as encryption key (matches server's encryptionKey)
        const encKeyBytes = derivedBits.slice(0, 32);
        this.encryptionKey = await crypto.subtle.importKey(
            'raw',
            encKeyBytes,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt'],
        );

        // Store raw key material for reference
        this.rawEncryptionKey = encKeyBytes;

        this.sequenceCounter = 0;

        // Auto-renew session before expiry
        if (this.config.autoRenew && handshakeResp.rotationIntervalMs > 0) {
            const renewIn = Math.max(handshakeResp.rotationIntervalMs * 0.9, 60_000);
            this.renewTimer = setTimeout(() => this.initialize(), renewIn);
        }
    }

    /**
     * Encrypted fetch — automatically encrypts request body and decrypts response.
     */
    async fetch(url: string, init?: RequestInit): Promise<Response> {
        if (!this.sessionId || !this.encryptionKey) {
            throw new Error('E2EE not initialized. Call initialize() first.');
        }

        const headers = new Headers(init?.headers);
        headers.set('x-gao-encrypted', '1');
        headers.set('x-gao-session-id', this.sessionId);

        let body = init?.body;
        if (body && typeof body === 'string') {
            // Encrypt the request body
            const envelope = await this.encrypt(body);
            body = JSON.stringify(envelope);
            headers.set('content-type', 'application/json');
        }

        const resp = await fetch(url, { ...init, headers, body });

        // Check if server response is encrypted
        if (resp.headers.get('x-gao-encrypted') === '1') {
            const encryptedBody = await resp.text();
            const envelope: EncryptedEnvelope = JSON.parse(encryptedBody);
            const decrypted = await this.decrypt(envelope);

            // Return a new Response with decrypted body
            return new Response(decrypted, {
                status: resp.status,
                statusText: resp.statusText,
                headers: resp.headers,
            });
        }

        return resp;
    }

    /** Encrypt plaintext into an envelope */
    private async encrypt(plaintext: string): Promise<EncryptedEnvelope> {
        if (!this.encryptionKey) throw new Error('No encryption key');

        const seq = ++this.sequenceCounter;
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const aad = new TextEncoder().encode(String(seq));

        const encoded = new TextEncoder().encode(plaintext);
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 },
            this.encryptionKey,
            encoded,
        );

        // AES-GCM in WebCrypto appends the tag to the ciphertext
        const combined = new Uint8Array(ciphertext);
        const tagStart = combined.length - 16;
        const data = combined.slice(0, tagStart);
        const tag = combined.slice(tagStart);

        return {
            iv: this.bufferToBase64Url(iv),
            tag: this.bufferToBase64Url(tag),
            data: this.bufferToBase64Url(data),
            seq,
        };
    }

    /** Decrypt an envelope to plaintext */
    private async decrypt(envelope: EncryptedEnvelope): Promise<string> {
        if (!this.encryptionKey) throw new Error('No encryption key');

        const iv = this.base64UrlToBuffer(envelope.iv);
        const tag = this.base64UrlToBuffer(envelope.tag);
        const data = this.base64UrlToBuffer(envelope.data);
        const aad = new TextEncoder().encode(String(envelope.seq));

        // WebCrypto expects tag appended to ciphertext
        const combined = new Uint8Array(data.byteLength + tag.byteLength);
        combined.set(new Uint8Array(data), 0);
        combined.set(new Uint8Array(tag), data.byteLength);

        const plaintext = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv), additionalData: aad, tagLength: 128 },
            this.encryptionKey,
            combined,
        );

        return new TextDecoder().decode(plaintext);
    }

    /** Destroy the E2EE session and clear keys */
    destroy(): void {
        if (this.renewTimer) clearTimeout(this.renewTimer);
        this.sessionId = null;
        this.encryptionKey = null;
        this.rawEncryptionKey = null;
        this.sequenceCounter = 0;
    }

    /** Check if the E2EE session is active */
    get isInitialized(): boolean {
        return this.sessionId !== null && this.encryptionKey !== null;
    }

    // ─── Utility ─────────────────────────────────────────────

    private bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    private base64UrlToBuffer(base64url: string): ArrayBuffer {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
    }
}
