/**
 * @gao/desktop — Tauri Config Generator
 *
 * Generates tauri.conf.json from gao.config.ts settings.
 */

export interface TauriWindowConfig {
    title?: string;
    width?: number;
    height?: number;
    resizable?: boolean;
    fullscreen?: boolean;
    center?: boolean;
    decorations?: boolean;
    transparent?: boolean;
    minWidth?: number;
    minHeight?: number;
}

export interface TauriSecurityConfig {
    csp?: string;
    dangerousRemoteDomainIpcAccess?: Array<{ domain: string; windows: string[]; enableTauriAPI: boolean }>;
}

export interface DesktopConfig {
    appName: string;
    version: string;
    identifier: string;
    window?: TauriWindowConfig;
    security?: TauriSecurityConfig;
    updater?: {
        active: boolean;
        endpoints: string[];
        pubkey?: string;
    };
}

export interface TauriConf {
    $schema: string;
    productName: string;
    version: string;
    identifier: string;
    build: { frontendDist: string; devUrl: string; beforeDevCommand: string; beforeBuildCommand: string };
    app: { windows: TauriWindowConfig[]; security: TauriSecurityConfig };
    plugins?: Record<string, unknown>;
}

/**
 * Generate a tauri.conf.json-compatible object from a DesktopConfig.
 */
export function generateTauriConfig(config: DesktopConfig): TauriConf {
    const window: TauriWindowConfig = {
        title: config.appName,
        width: 1024,
        height: 768,
        resizable: true,
        fullscreen: false,
        center: true,
        decorations: true,
        transparent: false,
        ...(config.window ?? {}),
    };

    const security: TauriSecurityConfig = {
        csp: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
        ...(config.security ?? {}),
    };

    const conf: TauriConf = {
        $schema: 'https://raw.githubusercontent.com/nicehash/tauri/v2/core/tauri-config-schema/schema.json',
        productName: config.appName,
        version: config.version,
        identifier: config.identifier,
        build: {
            frontendDist: '../dist',
            devUrl: 'http://localhost:5173',
            beforeDevCommand: 'pnpm dev',
            beforeBuildCommand: 'pnpm build',
        },
        app: {
            windows: [window],
            security,
        },
    };

    if (config.updater?.active) {
        conf.plugins = {
            updater: {
                active: true,
                endpoints: config.updater.endpoints,
                pubkey: config.updater.pubkey ?? '',
            },
        };
    }

    return conf;
}

/**
 * Serialize config to JSON string (pretty-printed).
 */
export function serializeTauriConfig(config: TauriConf): string {
    return JSON.stringify(config, null, 2);
}
