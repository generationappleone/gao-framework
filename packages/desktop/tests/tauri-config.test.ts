import { describe, it, expect } from 'vitest';
import { generateTauriConfig, serializeTauriConfig } from '../src/tauri-config.js';

describe('Tauri Config Generator', () => {
    it('should generate valid config with defaults', () => {
        const conf = generateTauriConfig({
            appName: 'My GAO App',
            version: '1.0.0',
            identifier: 'com.gao.myapp',
        });

        expect(conf.productName).toBe('My GAO App');
        expect(conf.version).toBe('1.0.0');
        expect(conf.identifier).toBe('com.gao.myapp');
        expect(conf.app.windows).toHaveLength(1);
        expect(conf.app.windows[0].width).toBe(1024);
        expect(conf.app.windows[0].height).toBe(768);
        expect(conf.app.windows[0].resizable).toBe(true);
        expect(conf.app.security.csp).toContain("default-src 'self'");
    });

    it('should apply custom window config', () => {
        const conf = generateTauriConfig({
            appName: 'Custom',
            version: '0.1.0',
            identifier: 'com.gao.custom',
            window: { width: 1920, height: 1080, fullscreen: true },
        });

        expect(conf.app.windows[0].width).toBe(1920);
        expect(conf.app.windows[0].height).toBe(1080);
        expect(conf.app.windows[0].fullscreen).toBe(true);
    });

    it('should include updater plugin when active', () => {
        const conf = generateTauriConfig({
            appName: 'Updatable',
            version: '1.0.0',
            identifier: 'com.gao.updatable',
            updater: { active: true, endpoints: ['https://update.example.com/check'] },
        });

        expect(conf.plugins).toBeDefined();
        expect((conf.plugins as any).updater.active).toBe(true);
        expect((conf.plugins as any).updater.endpoints).toContain('https://update.example.com/check');
    });

    it('should serialize to valid JSON', () => {
        const conf = generateTauriConfig({ appName: 'JSON', version: '0.0.1', identifier: 'com.gao.json' });
        const json = serializeTauriConfig(conf);
        const parsed = JSON.parse(json);
        expect(parsed.productName).toBe('JSON');
    });
});
