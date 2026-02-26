/**
 * @gao/mobile — Native Plugin Bridge
 *
 * Type-safe wrappers for common Capacitor native plugins.
 * Each wrapper gracefully falls back on web/desktop.
 */

export interface CameraResult {
    path: string;
    webPath: string;
    format: string;
}

export interface GeoPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
}

export interface PushNotification {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
}

/**
 * Abstract base that plugin wrappers extend.
 * When Capacitor is not available, methods return fallback values.
 */
function isMobile(): boolean {
    if (typeof globalThis === 'undefined') return false;
    return '__CAPACITOR__' in globalThis || (typeof navigator !== 'undefined' && /android|iphone|ipad/i.test(navigator.userAgent ?? ''));
}

/**
 * Camera plugin wrapper.
 */
export const Camera = {
    async takePhoto(): Promise<CameraResult | null> {
        if (!isMobile()) return null;
        try {
            const { Camera: CapCamera, CameraResultType } = await import('@capacitor/camera' as string);
            const result = await CapCamera.getPhoto({ resultType: CameraResultType.Uri, quality: 90 });
            return { path: result.path ?? '', webPath: result.webPath ?? '', format: result.format };
        } catch {
            return null;
        }
    },
};

/**
 * Geolocation plugin wrapper.
 */
export const Geolocation = {
    async getCurrentPosition(): Promise<GeoPosition | null> {
        const nav = typeof navigator !== 'undefined' ? navigator : null;
        if (!isMobile() && nav && 'geolocation' in nav) {
            // Web fallback via navigator.geolocation
            return new Promise((resolve) => {
                (nav as any).geolocation.getCurrentPosition(
                    (pos: any) =>
                        resolve({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                            timestamp: pos.timestamp,
                        }),
                    () => resolve(null),
                    { timeout: 10000 },
                );
            });
        }
        if (!isMobile()) return null;
        try {
            const { Geolocation: CapGeo } = await import('@capacitor/geolocation' as string);
            const pos = await CapGeo.getCurrentPosition();
            return {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: pos.timestamp,
            };
        } catch {
            return null;
        }
    },
};

/**
 * Share plugin wrapper.
 */
export const Share = {
    async share(options: { title?: string; text?: string; url?: string }): Promise<boolean> {
        // Web fallback
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
            try {
                await (navigator as any).share(options);
                return true;
            } catch {
                return false;
            }
        }
        if (!isMobile()) return false;
        try {
            const { Share: CapShare } = await import('@capacitor/share' as string);
            await CapShare.share(options);
            return true;
        } catch {
            return false;
        }
    },
};
