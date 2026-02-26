/**
 * @gao/desktop — Auto-Update System
 *
 * Wraps Tauri's updater plugin for checking, downloading, and installing updates.
 */

export interface UpdateInfo {
    version: string;
    date?: string;
    body?: string;
}

export interface UpdaterConfig {
    endpoints: string[];
    pubkey?: string;
    /** Check interval in minutes (default: 60) */
    checkInterval?: number;
}

/**
 * Check for updates by hitting the configured endpoints.
 *
 * In a Tauri runtime this delegates to `@tauri-apps/plugin-updater`.
 * Outside of Tauri (e.g. tests) it returns null.
 */
export async function checkForUpdate(_config: UpdaterConfig): Promise<UpdateInfo | null> {
    if (typeof globalThis !== 'undefined' && '__TAURI__' in globalThis) {
        try {
            const { check } = await import('@tauri-apps/plugin-updater' as string);
            const update = await check();
            if (!update) return null;
            return { version: update.version, date: update.date, body: update.body ?? undefined };
        } catch {
            return null;
        }
    }
    // Not running in Tauri — skip silently.
    return null;
}

/**
 * Download and install a pending update.
 */
export async function installUpdate(): Promise<boolean> {
    if (typeof globalThis !== 'undefined' && '__TAURI__' in globalThis) {
        try {
            const { check } = await import('@tauri-apps/plugin-updater' as string);
            const update = await check();
            if (!update) return false;
            await update.downloadAndInstall();
            return true;
        } catch {
            return false;
        }
    }
    return false;
}
