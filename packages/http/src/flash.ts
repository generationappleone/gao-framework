/**
 * @gao/http — Flash Messages
 *
 * Session-based one-time data: available only on the next request, then auto-deleted.
 */

import type { Session } from './session.js';

const FLASH_KEY = '__gao_flash';
const FLASH_OLD_KEY = '__gao_flash_old';

/**
 * Flash message manager — wraps session to provide one-time flash data.
 */
export class FlashMessages {
    constructor(private session: Session) { }

    /**
     * Set a flash message (available on next request only).
     */
    flash(key: string, value: unknown): void {
        const flashData = this.session.get<Record<string, unknown>>(FLASH_KEY) || {};
        flashData[key] = value;
        this.session.set(FLASH_KEY, flashData);
    }

    /**
     * Get a flash message (consumes it — only available once).
     */
    get<T = unknown>(key: string): T | undefined {
        const oldData = this.session.get<Record<string, unknown>>(FLASH_OLD_KEY) || {};
        const value = oldData[key] as T | undefined;
        return value;
    }

    /**
     * Check if a flash message exists.
     */
    has(key: string): boolean {
        const oldData = this.session.get<Record<string, unknown>>(FLASH_OLD_KEY) || {};
        return key in oldData;
    }

    /**
     * Get all flash messages.
     */
    all(): Record<string, unknown> {
        return this.session.get<Record<string, unknown>>(FLASH_OLD_KEY) || {};
    }

    /**
     * Age flash data: move current flash to old, clear old.
     * Should be called at the START of each request.
     */
    age(): void {
        // Move current flash to old (available for reading)
        const current = this.session.get<Record<string, unknown>>(FLASH_KEY) || {};
        this.session.set(FLASH_OLD_KEY, current);
        // Clear current flash (next request will start fresh)
        this.session.set(FLASH_KEY, {});
    }
}
