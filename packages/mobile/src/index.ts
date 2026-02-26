/**
 * @gao/mobile — Public API
 */

export { generateCapacitorConfig, serializeCapacitorConfig } from './capacitor-config.js';
export type { MobileConfig, CapacitorConf } from './capacitor-config.js';

export { Camera, Geolocation, Share } from './plugins.js';
export type { CameraResult, GeoPosition, PushNotification } from './plugins.js';

export { buildMobile } from './build.js';
export type { MobileBuildOptions, MobileTarget } from './build.js';

export { Platform } from './platform.js';
export type { PlatformType } from './platform.js';
