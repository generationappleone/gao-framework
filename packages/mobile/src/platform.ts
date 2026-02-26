/**
 * @gao/mobile — Platform Detection
 *
 * Detect whether code is running on web, desktop (Tauri), or mobile (Capacitor).
 */

export type PlatformType = 'web' | 'desktop' | 'mobile';

function detect(): PlatformType {
    // Check for Tauri
    if (typeof globalThis !== 'undefined' && '__TAURI__' in globalThis) {
        return 'desktop';
    }

    // Check for Capacitor
    if (typeof globalThis !== 'undefined' && '__CAPACITOR__' in globalThis) {
        return 'mobile';
    }

    // Heuristic: user-agent based mobile detection (for wrapped web views)
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
        if (/android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
            return 'mobile';
        }
    }

    return 'web';
}

let cached: PlatformType | null = null;

export const Platform = {
    /**
     * Get the current platform.
     */
    get current(): PlatformType {
        if (cached === null) cached = detect();
        return cached;
    },

    /**
     * Check if the app is running on a specific platform.
     */
    is(type: PlatformType): boolean {
        return this.current === type;
    },

    /**
     * Force a specific platform (useful for testing).
     */
    __setForTesting(type: PlatformType): void {
        cached = type;
    },

    /**
     * Reset cached value.
     */
    __reset(): void {
        cached = null;
    },
};
