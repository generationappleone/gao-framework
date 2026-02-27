/**
 * @gao/ui — Font Registry Tests
 *
 * 10 tests covering font registration, CSS generation,
 * selective injection, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    registerFont,
    getFont,
    getAllFontNames,
    getAllFonts,
    generateFontCSS,
    injectFonts,
    fontCount,
    clearFontRegistry,
    type GaoFontData,
    type GaoFontName,
} from '../src/fonts/font-registry.js';

// ─── Helper ──────────────────────────────────────────────────

function createMockFont(name: string, category: GaoFontData['category'] = 'sans'): GaoFontData {
    return {
        family: name,
        fontFace: `@font-face { font-family: '${name}'; font-weight: 400; font-display: swap; src: local('${name}'); }`,
        fallback: 'sans-serif',
        cssVariable: `--gao-font-${category}`,
        weights: [400, 700],
        category,
        cssProperties: `  --gao-${category}-line-height: 1.5;`,
    };
}

// ─── Tests ───────────────────────────────────────────────────

describe('FontRegistry', () => {
    beforeEach(() => {
        clearFontRegistry();
    });

    it('should register a font and retrieve it', () => {
        const data = createMockFont('TestSans');
        registerFont('GaoSans' as GaoFontName, data);

        const result = getFont('GaoSans');
        expect(result.family).toBe('TestSans');
        expect(result.weights).toEqual([400, 700]);
        expect(result.category).toBe('sans');
    });

    it('should throw when registering a duplicate font', () => {
        registerFont('GaoSans' as GaoFontName, createMockFont('TestSans'));
        expect(() => registerFont('GaoSans' as GaoFontName, createMockFont('TestSans2'))).toThrow(
            'Font "GaoSans" is already registered',
        );
    });

    it('should throw when getting an unregistered font', () => {
        expect(() => getFont('GaoSans')).toThrow('Font "GaoSans" is not registered');
    });

    it('should list all registered font names', () => {
        registerFont('GaoSans' as GaoFontName, createMockFont('TestSans'));
        registerFont('GaoMono' as GaoFontName, createMockFont('TestMono', 'mono'));
        registerFont('GaoDisplay' as GaoFontName, createMockFont('TestDisplay', 'display'));

        const names = getAllFontNames();
        expect(names).toHaveLength(3);
        expect(names).toContain('GaoSans');
        expect(names).toContain('GaoMono');
        expect(names).toContain('GaoDisplay');
    });

    it('should generate CSS for all registered fonts', () => {
        registerFont('GaoSans' as GaoFontName, createMockFont('TestSans'));
        registerFont('GaoMono' as GaoFontName, createMockFont('TestMono', 'mono'));

        const css = generateFontCSS();
        expect(css).toContain('@font-face');
        expect(css).toContain("font-family: 'TestSans'");
        expect(css).toContain("font-family: 'TestMono'");
        expect(css).toContain(':root');
        expect(css).toContain("--gao-font-sans: 'TestSans'");
        expect(css).toContain("--gao-font-mono: 'TestMono'");
    });

    it('should generate CSS for selective fonts only', () => {
        registerFont('GaoSans' as GaoFontName, createMockFont('TestSans'));
        registerFont('GaoMono' as GaoFontName, createMockFont('TestMono', 'mono'));

        const css = generateFontCSS(['GaoSans']);
        expect(css).toContain("font-family: 'TestSans'");
        expect(css).not.toContain("font-family: 'TestMono'");
        expect(css).toContain("--gao-font-sans: 'TestSans'");
        expect(css).not.toContain('--gao-font-mono');
    });

    it('should throw when generating CSS for unregistered font name', () => {
        expect(() => generateFontCSS(['GaoSans'])).toThrow('Font "GaoSans" is not registered');
    });

    it('should return empty comment when no fonts are registered', () => {
        const css = generateFontCSS();
        expect(css).toBe('/* No GaoType fonts registered */');
    });

    it('should include CSS custom properties in generated output', () => {
        registerFont('GaoSans' as GaoFontName, createMockFont('TestSans'));

        const css = generateFontCSS();
        expect(css).toContain('--gao-sans-line-height: 1.5');
        expect(css).toContain('Font-specific properties');
    });

    it('should generate valid <style> tag via injectFonts()', () => {
        registerFont('GaoSans' as GaoFontName, createMockFont('TestSans'));

        const html = injectFonts(['GaoSans']);
        expect(html).toMatch(/^<style id="gao-fonts">/);
        expect(html).toMatch(/<\/style>$/);
        expect(html).toContain('@font-face');
        expect(html).toContain(':root');
    });
});

describe('FontRegistry — Integration with real fonts', () => {
    beforeEach(() => {
        clearFontRegistry();
    });

    it('should register all 10 fonts and count them', async () => {
        // Import all fonts — each one self-registers
        await import('../src/fonts/gao-sans.js');
        await import('../src/fonts/gao-mono.js');
        await import('../src/fonts/gao-display.js');
        await import('../src/fonts/gao-slab.js');
        await import('../src/fonts/gao-rounded.js');
        await import('../src/fonts/gao-condensed.js');
        await import('../src/fonts/gao-script.js');
        await import('../src/fonts/gao-pixel.js');
        await import('../src/fonts/gao-handwriting.js');
        await import('../src/fonts/gao-terminal.js');

        expect(fontCount()).toBe(10);

        const names = getAllFontNames();
        expect(names).toContain('GaoSans');
        expect(names).toContain('GaoMono');
        expect(names).toContain('GaoDisplay');
        expect(names).toContain('GaoSlab');
        expect(names).toContain('GaoRounded');
        expect(names).toContain('GaoCondensed');
        expect(names).toContain('GaoScript');
        expect(names).toContain('GaoPixel');
        expect(names).toContain('GaoHandwriting');
        expect(names).toContain('GaoTerminal');

        // Each font should have valid data
        for (const name of names) {
            const font = getFont(name);
            expect(font.family).toBeTruthy();
            expect(font.fontFace).toContain('@font-face');
            expect(font.fallback).toBeTruthy();
            expect(font.cssVariable).toMatch(/^--gao-font-/);
            expect(font.weights.length).toBeGreaterThan(0);
            expect(font.cssProperties).toBeTruthy();
        }

        // Full CSS gen
        const css = generateFontCSS();
        expect(css).toContain('GaoType');
        expect(css).toContain('10 font families');
    });
});
