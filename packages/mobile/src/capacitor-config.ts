/**
 * @gao/mobile — Capacitor Config Generator
 *
 * Auto-generates capacitor.config.ts from gao.config.ts.
 */

export interface MobileConfig {
    appId: string;
    appName: string;
    webDir?: string;
    server?: {
        url?: string;
        cleartext?: boolean;
        hostname?: string;
    };
    android?: {
        buildOptions?: Record<string, unknown>;
        minSdkVersion?: number;
    };
    ios?: {
        scheme?: string;
        limitsNavigationsToAppBoundDomains?: boolean;
    };
    plugins?: Record<string, Record<string, unknown>>;
}

export interface CapacitorConf {
    appId: string;
    appName: string;
    webDir: string;
    server?: MobileConfig['server'];
    android?: MobileConfig['android'];
    ios?: MobileConfig['ios'];
    plugins?: MobileConfig['plugins'];
}

/**
 * Generate a Capacitor config object.
 */
export function generateCapacitorConfig(config: MobileConfig): CapacitorConf {
    const conf: CapacitorConf = {
        appId: config.appId,
        appName: config.appName,
        webDir: config.webDir ?? 'dist',
    };

    if (config.server) conf.server = config.server;
    if (config.android) conf.android = config.android;
    if (config.ios) conf.ios = config.ios;
    if (config.plugins) conf.plugins = config.plugins;

    return conf;
}

/**
 * Serialize Capacitor config to a TypeScript module string.
 */
export function serializeCapacitorConfig(conf: CapacitorConf): string {
    const json = JSON.stringify(conf, null, 2);
    return `import type { CapacitorConfig } from '@capacitor/cli';\n\nconst config: CapacitorConfig = ${json};\n\nexport default config;\n`;
}
