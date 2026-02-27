/**
 * @gao/http — Session Management
 *
 * Cookie-based session with pluggable stores.
 */

import { randomUUID } from 'node:crypto';

// ─── Session Store Interface ───────────────────────────────────

export interface SessionStore {
    /** Get session data by ID */
    get(id: string): Promise<Record<string, unknown> | null>;
    /** Set session data with TTL in seconds */
    set(id: string, data: Record<string, unknown>, ttlSeconds: number): Promise<void>;
    /** Destroy a session */
    destroy(id: string): Promise<void>;
    /** Touch/renew session TTL */
    touch(id: string, ttlSeconds: number): Promise<void>;
}

// ─── Memory Store (Development) ────────────────────────────────

interface MemoryEntry {
    data: Record<string, unknown>;
    expiresAt: number;
}

export class MemorySessionStore implements SessionStore {
    private store = new Map<string, MemoryEntry>();
    private maxSessions: number;

    constructor(options?: { maxSessions?: number }) {
        this.maxSessions = options?.maxSessions ?? 10_000;
    }

    async get(id: string): Promise<Record<string, unknown> | null> {
        const entry = this.store.get(id);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(id);
            return null;
        }
        return { ...entry.data };
    }

    async set(id: string, data: Record<string, unknown>, ttlSeconds: number): Promise<void> {
        // Evict oldest if at capacity
        if (this.store.size >= this.maxSessions && !this.store.has(id)) {
            const oldest = this.store.keys().next().value;
            if (oldest) this.store.delete(oldest);
        }
        this.store.set(id, {
            data: { ...data },
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    async destroy(id: string): Promise<void> {
        this.store.delete(id);
    }

    async touch(id: string, ttlSeconds: number): Promise<void> {
        const entry = this.store.get(id);
        if (entry) {
            entry.expiresAt = Date.now() + ttlSeconds * 1000;
        }
    }

    /** Get current store size (for debugging) */
    get size(): number {
        return this.store.size;
    }
}

// ─── Session Config ────────────────────────────────────────────

export interface SessionConfig {
    /** Cookie name, default: 'gao_session' */
    cookieName?: string;
    /** Session TTL in seconds, default: 86400 (24h) */
    ttl?: number;
    /** Cookie secure flag (HTTPS only), default: true in production */
    secure?: boolean;
    /** Cookie httpOnly, default: true */
    httpOnly?: boolean;
    /** Cookie sameSite, default: 'Lax' */
    sameSite?: 'Strict' | 'Lax' | 'None';
    /** Cookie path, default: '/' */
    path?: string;
    /** Cookie domain */
    domain?: string;
    /** Session store implementation */
    store?: SessionStore;
}

// ─── Session Instance ──────────────────────────────────────────

export class Session {
    private data: Record<string, unknown> = {};
    private _isNew = true;
    private _isDirty = false;

    constructor(
        public readonly id: string,
        initialData?: Record<string, unknown>,
    ) {
        if (initialData) {
            this.data = { ...initialData };
            this._isNew = false;
        }
    }

    get<T = unknown>(key: string): T | undefined {
        return this.data[key] as T | undefined;
    }

    set(key: string, value: unknown): void {
        this.data[key] = value;
        this._isDirty = true;
    }

    has(key: string): boolean {
        return key in this.data;
    }

    delete(key: string): void {
        delete this.data[key];
        this._isDirty = true;
    }

    all(): Record<string, unknown> {
        return { ...this.data };
    }

    get isNew(): boolean {
        return this._isNew;
    }

    get isDirty(): boolean {
        return this._isDirty;
    }
}

// ─── Session Manager ───────────────────────────────────────────

export class SessionManager {
    private store: SessionStore;
    private config: Required<Omit<SessionConfig, 'store' | 'domain'>> & { domain?: string };

    constructor(options: SessionConfig = {}) {
        this.store = options.store || new MemorySessionStore();
        this.config = {
            cookieName: options.cookieName || 'gao_session',
            ttl: options.ttl || 86400,
            secure: options.secure ?? (process.env.NODE_ENV === 'production'),
            httpOnly: options.httpOnly ?? true,
            sameSite: options.sameSite || 'Lax',
            path: options.path || '/',
            domain: options.domain,
        };
    }

    /**
     * Load or create session from a cookie header string.
     */
    async loadSession(cookieHeader: string | null): Promise<Session> {
        const sessionId = this.parseCookie(cookieHeader);

        if (sessionId) {
            const data = await this.store.get(sessionId);
            if (data) {
                return new Session(sessionId, data);
            }
        }

        // Create new session
        return new Session(randomUUID());
    }

    /**
     * Save session and return Set-Cookie header value.
     */
    async saveSession(session: Session): Promise<string> {
        if (session.isDirty || session.isNew) {
            await this.store.set(session.id, session.all(), this.config.ttl);
        } else {
            await this.store.touch(session.id, this.config.ttl);
        }

        return this.buildSetCookie(session.id);
    }

    /**
     * Destroy a session and return expired Set-Cookie header.
     */
    async destroySession(session: Session): Promise<string> {
        await this.store.destroy(session.id);
        return this.buildSetCookie('', 0); // Expire immediately
    }

    /**
     * Regenerate session (new ID, preserve data).
     */
    async regenerateSession(session: Session): Promise<Session> {
        await this.store.destroy(session.id);
        const newSession = new Session(randomUUID());
        for (const [key, value] of Object.entries(session.all())) {
            newSession.set(key, value);
        }
        return newSession;
    }

    // ─── Private Helpers ───────────────────────────────────────

    private parseCookie(header: string | null): string | null {
        if (!header) return null;
        const prefix = `${this.config.cookieName}=`;
        const cookies = header.split(';');
        for (const cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith(prefix)) {
                return trimmed.slice(prefix.length);
            }
        }
        return null;
    }

    private buildSetCookie(value: string, maxAge?: number): string {
        const parts = [`${this.config.cookieName}=${value}`];
        parts.push(`Path=${this.config.path}`);
        parts.push(`Max-Age=${maxAge ?? this.config.ttl}`);
        if (this.config.httpOnly) parts.push('HttpOnly');
        if (this.config.secure) parts.push('Secure');
        parts.push(`SameSite=${this.config.sameSite}`);
        if (this.config.domain) parts.push(`Domain=${this.config.domain}`);
        return parts.join('; ');
    }
}
