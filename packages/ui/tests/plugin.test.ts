/**
 * @gao/ui — Plugin Tests (8 tests)
 */
import { describe, it, expect } from 'vitest';
import { gaoUIPlugin, createUIHelpers } from '../src/plugin.js';

// Load all fonts and icons
import '../src/fonts/gao-sans.js';
import '../src/fonts/gao-mono.js';
import '../src/icons/sets/navigation.js';
import '../src/icons/sets/actions.js';
import '../src/icons/sets/status.js';

describe('gaoUIPlugin', () => {
    it('should create a plugin with name and version', () => {
        const plugin = gaoUIPlugin();
        expect(plugin.name).toBe('@gao/ui');
        expect(plugin.version).toBe('0.1.0');
        expect(typeof plugin.onRegister).toBe('function');
        expect(typeof plugin.onBoot).toBe('function');
    });

    it('should register helpers in a mock container', () => {
        const plugin = gaoUIPlugin();
        const store: Record<string, any> = {};
        const container = {
            singleton: (key: string, factory: () => any) => { store[key] = factory(); },
            resolve: (key: string) => store[key],
            has: (key: string) => key in store,
        };
        plugin.onRegister(container);
        expect(store['ui.helpers']).toBeDefined();
        expect(typeof store['ui.helpers'].gaoIcon).toBe('function');
        expect(typeof store['ui.helpers'].injectFonts).toBe('function');
        expect(typeof store['ui.helpers'].statCard).toBe('function');
    });

    it('should make gaoIcon helper render SVG', () => {
        const helpers = createUIHelpers();
        const svg = helpers['gaoIcon']('home', { size: 20 });
        expect(svg).toContain('<svg');
        expect(svg).toContain('gao-icon-home');
    });

    it('should make injectFonts helper generate CSS', () => {
        const helpers = createUIHelpers();
        const html = helpers['injectFonts'](['GaoSans']);
        expect(html).toContain('<style');
        expect(html).toContain('@font-face');
        expect(html).toContain('GaoSans');
    });

    it('should make statCard helper render component', () => {
        const helpers = createUIHelpers();
        const html = helpers['statCard']({ label: 'Test', value: 42, icon: 'home' });
        expect(html).toContain('gao-admin-stat-card');
        expect(html).toContain('42');
    });

    it('should be backward compatible (no crash without view engine)', () => {
        const plugin = gaoUIPlugin();
        const store: Record<string, any> = {};
        const container = {
            singleton: (key: string, factory: () => any) => { store[key] = factory(); },
            resolve: (key: string) => store[key],
            has: (key: string) => key in store,
        };
        plugin.onRegister(container);
        // onBoot should not throw even without view engine
        expect(() => plugin.onBoot(container)).not.toThrow();
    });

    it('should support selective activation (fonts only)', () => {
        const helpers = createUIHelpers({ fonts: true, icons: false, admin: false });
        expect(helpers['injectFonts']).toBeDefined();
        expect(helpers['gaoIcon']).toBeUndefined();
        expect(helpers['statCard']).toBeUndefined();
    });

    it('should support selective activation (icons only)', () => {
        const helpers = createUIHelpers({ fonts: false, icons: true, admin: false });
        expect(helpers['injectFonts']).toBeUndefined();
        expect(helpers['gaoIcon']).toBeDefined();
        expect(helpers['statCard']).toBeUndefined();
    });
});
