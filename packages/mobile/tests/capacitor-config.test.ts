import { describe, it, expect } from 'vitest';
import { generateCapacitorConfig, serializeCapacitorConfig } from '../src/capacitor-config.js';

describe('Capacitor Config Generator', () => {
    it('should generate valid config with defaults', () => {
        const conf = generateCapacitorConfig({
            appId: 'com.gao.myapp',
            appName: 'My GAO App',
        });

        expect(conf.appId).toBe('com.gao.myapp');
        expect(conf.appName).toBe('My GAO App');
        expect(conf.webDir).toBe('dist');
    });

    it('should include server config when provided', () => {
        const conf = generateCapacitorConfig({
            appId: 'com.gao.dev',
            appName: 'Dev App',
            server: { url: 'http://localhost:3000', cleartext: true },
        });

        expect(conf.server?.url).toBe('http://localhost:3000');
        expect(conf.server?.cleartext).toBe(true);
    });

    it('should include android/ios config when provided', () => {
        const conf = generateCapacitorConfig({
            appId: 'com.gao.native',
            appName: 'Native',
            android: { minSdkVersion: 26 },
            ios: { scheme: 'MyApp' },
        });

        expect(conf.android?.minSdkVersion).toBe(26);
        expect(conf.ios?.scheme).toBe('MyApp');
    });

    it('should serialize to a TypeScript module string', () => {
        const conf = generateCapacitorConfig({ appId: 'com.gao.ts', appName: 'TS' });
        const ts = serializeCapacitorConfig(conf);
        expect(ts).toContain("import type { CapacitorConfig }");
        expect(ts).toContain('"appId": "com.gao.ts"');
        expect(ts).toContain('export default config;');
    });
});
