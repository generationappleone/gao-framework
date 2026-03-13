/**
 * @gao/ui — Theme Engine Tests
 *
 * Tests for theme generation, presets, engine, and script.
 */

import { describe, it, expect } from 'vitest';
import { generateThemeCSS, injectTheme } from '../src/theme/theme-engine.js';
import { GAO_THEMES, getPresetTheme, getPresetNames } from '../src/theme/theme-presets.js';
import { themeScript, injectThemeScript } from '../src/theme/theme-script.js';
import type { GaoThemeConfig } from '../src/theme/theme-types.js';

// ─── Theme Engine ────────────────────────────────────────────

describe('generateThemeCSS()', () => {
    it('should generate CSS with primary color only', () => {
        const config: GaoThemeConfig = {
            name: 'test',
            colors: { primary: { h: 215, s: 70, l: 40 } },
        };
        const css = generateThemeCSS(config);
        expect(css).toContain('--gao-primary-h: 215');
        expect(css).toContain('--gao-primary-s: 70%');
        expect(css).toContain('--gao-primary-l: 40%');
        expect(css).toContain('--gao-primary: hsl(215, 70%, 40%)');
    });

    it('should auto-generate light/dark/bg variants from primary', () => {
        const config: GaoThemeConfig = {
            name: 'test',
            colors: { primary: { h: 215, s: 70, l: 40 } },
        };
        const css = generateThemeCSS(config);
        expect(css).toContain('--gao-primary-light:');
        expect(css).toContain('--gao-primary-dark:');
        expect(css).toContain('--gao-primary-bg:');
    });

    it('should auto-default secondary (primary.h + 30°)', () => {
        const config: GaoThemeConfig = {
            name: 'test',
            colors: { primary: { h: 200, s: 70, l: 40 } },
        };
        const css = generateThemeCSS(config);
        expect(css).toContain('--gao-secondary: hsl(230');
    });

    it('should auto-default accent (primary.h + 40°)', () => {
        const config: GaoThemeConfig = {
            name: 'test',
            colors: { primary: { h: 200, s: 70, l: 40 } },
        };
        const css = generateThemeCSS(config);
        expect(css).toContain('--gao-accent: hsl(240');
    });

    it('should include dark mode overrides', () => {
        const config: GaoThemeConfig = {
            name: 'test',
            colors: { primary: { h: 215, s: 70, l: 40 } },
        };
        const css = generateThemeCSS(config);
        expect(css).toContain('[data-theme="dark"]');
        expect(css).toContain('--gao-primary-bg:');
    });

    it('should map radius preset to CSS variables', () => {
        const config: GaoThemeConfig = {
            name: 'test',
            colors: { primary: { h: 215, s: 70, l: 40 } },
            radius: 'lg',
        };
        const css = generateThemeCSS(config);
        expect(css).toContain('--gao-radius-sm: 0.5rem');
        expect(css).toContain('--gao-radius-md: 0.75rem');
    });

    it('should map density preset to spacing overrides', () => {
        const config: GaoThemeConfig = {
            name: 'test',
            colors: { primary: { h: 215, s: 70, l: 40 } },
            density: 'compact',
        };
        const css = generateThemeCSS(config);
        expect(css).toContain('--gao-space-4: 0.75rem');
    });

    it('should include font override when provided', () => {
        const config: GaoThemeConfig = {
            name: 'test',
            colors: { primary: { h: 215, s: 70, l: 40 } },
            fontFamily: 'Inter',
        };
        const css = generateThemeCSS(config);
        expect(css).toContain("--gao-font-sans: 'Inter'");
    });

    it('should use custom semantic colors when provided', () => {
        const config: GaoThemeConfig = {
            name: 'test',
            colors: {
                primary: { h: 215, s: 70, l: 40 },
                success: { h: 140, s: 50, l: 45 },
            },
        };
        const css = generateThemeCSS(config);
        expect(css).toContain('--gao-success: hsl(140, 50%, 45%)');
    });
});

// ─── Theme Presets ───────────────────────────────────────────

describe('Theme Presets', () => {
    it('should have exactly 7 preset themes', () => {
        expect(getPresetNames()).toHaveLength(7);
    });

    it('should include all expected preset names', () => {
        const names = getPresetNames();
        expect(names).toContain('gao');
        expect(names).toContain('ocean');
        expect(names).toContain('forest');
        expect(names).toContain('sunset');
        expect(names).toContain('midnight');
        expect(names).toContain('rose');
        expect(names).toContain('slate');
    });

    it('should have GAO default with HSL(215, 70%, 40%)', () => {
        const gao = GAO_THEMES.gao;
        expect(gao.colors.primary.h).toBe(215);
        expect(gao.colors.primary.s).toBe(70);
        expect(gao.colors.primary.l).toBe(40);
    });

    it('should generate valid CSS for each preset', () => {
        for (const name of getPresetNames()) {
            const theme = getPresetTheme(name);
            expect(theme).toBeDefined();
            const css = generateThemeCSS(theme!);
            expect(css).toContain('--gao-primary-h:');
            expect(css).toContain('--gao-primary:');
            expect(css).toContain(':root');
        }
    });
});

// ─── injectTheme() ───────────────────────────────────────────

describe('injectTheme()', () => {
    it('should accept string preset name "gao"', () => {
        const html = injectTheme('gao');
        expect(html).toContain('<style id="gao-theme-gao">');
        expect(html).toContain('--gao-primary-h: 215');
        expect(html).toContain('</style>');
    });

    it('should accept custom config object', () => {
        const html = injectTheme({
            name: 'custom',
            colors: { primary: { h: 300, s: 80, l: 50 } },
        });
        expect(html).toContain('<style id="gao-theme-custom">');
        expect(html).toContain('--gao-primary-h: 300');
    });

    it('should throw on unknown preset name', () => {
        expect(() => injectTheme('nonexistent' as any)).toThrow('Unknown theme preset');
    });
});

// ─── Theme Script ────────────────────────────────────────────

describe('Theme Script', () => {
    it('should contain gaoTheme.set() function', () => {
        const script = themeScript();
        expect(script).toContain('window.gaoTheme');
        expect(script).toContain('.set');
    });

    it('should contain gaoTheme.get() function', () => {
        expect(themeScript()).toContain('.get');
    });

    it('should contain localStorage logic', () => {
        const script = themeScript();
        expect(script).toContain('localStorage');
        expect(script).toContain('gao-theme');
    });

    it('should contain toggleDark function', () => {
        expect(themeScript()).toContain('toggleDark');
    });

    it('should auto-restore on page load', () => {
        expect(themeScript()).toContain('restore()');
    });

    it('should wrap in <script> tag via injectThemeScript()', () => {
        const html = injectThemeScript();
        expect(html).toContain('<script id="gao-theme-script">');
        expect(html).toContain('</script>');
    });
});
