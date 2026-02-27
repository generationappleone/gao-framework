/**
 * @gao/view — UI Integration Tests
 *
 * Verifies that @gao/ui plugin helpers and directives work
 * correctly inside the view engine templates.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { GaoViewEngine } from '../src/engine.js';

describe('UI Integration — Directives & Helpers', () => {
    let engine: GaoViewEngine;

    // Mock UI helpers simulating what @gao/ui plugin injects
    const mockUIHelpers: Record<string, Function> = {
        injectFonts: (names?: string[]) =>
            `<style>/* fonts: ${(names ?? ['all']).join(', ')} */</style>`,
        gaoIcon: (name: string, opts?: Record<string, unknown>) => {
            const size = (opts?.size as number) ?? 24;
            return `<svg class="gao-icon" width="${size}" height="${size}"><use href="#${name}"/></svg>`;
        },
        adminLayout: (config: Record<string, unknown>) =>
            `<div class="gao-admin">${config.title ?? 'Admin'}</div>`,
        adminCSS: () => '<style>.gao-admin{}</style>',
        adminScripts: () => '<script>/* admin scripts */</script>',
        statCard: (c: any) => `<div class="stat-card">${c.label}: ${c.value}</div>`,
    };

    beforeEach(() => {
        engine = new GaoViewEngine({
            viewsPath: '/tmp/views',
            uiHelpers: mockUIHelpers,
        });
    });

    // ─── Directive Tests ─────────────────────────────────────

    it('@fonts directive should inject font CSS', () => {
        const template = `@fonts(['GaoSans', 'GaoMono'])`;
        const result = engine.renderString(template);
        expect(result).toContain('<style>');
        expect(result).toContain('GaoSans');
        expect(result).toContain('GaoMono');
    });

    it('@icon directive should render SVG', () => {
        const template = `@icon('home', { size: 20 })`;
        const result = engine.renderString(template);
        expect(result).toContain('<svg');
        expect(result).toContain('width="20"');
        expect(result).toContain('#home');
    });

    it('@adminLayout directive should render admin page', () => {
        const template = `@adminLayout({ title: 'Dashboard' })`;
        const result = engine.renderString(template);
        expect(result).toContain('gao-admin');
        expect(result).toContain('Dashboard');
    });

    // ─── Helper Tests (via expressions) ──────────────────────

    it('gaoIcon helper should work via !{} expression (no nested braces)', () => {
        // Note: !{} uses lazy regex — nested braces break it.
        // Use @icon directive for complex args, !{} for simple calls.
        const template = `!{gaoIcon('edit')}`;
        const result = engine.renderString(template);
        expect(result).toContain('<svg');
        expect(result).toContain('#edit');
    });

    it('injectFonts helper should work via !{} expression', () => {
        const template = `!{injectFonts()}`;
        const result = engine.renderString(template);
        expect(result).toContain('<style>');
        expect(result).toContain('all');
    });

    it('statCard helper should work via <@ block expression', () => {
        // statCard requires object arg with braces — use <@ @> block instead of !{}
        const template = `<@ __target(statCard({ label: 'Users', value: 1234 })); @>`;
        const result = engine.renderString(template);
        expect(result).toContain('stat-card');
        expect(result).toContain('Users: 1234');
    });

    // ─── Backward Compatibility ──────────────────────────────

    it('engine should work without UI helpers (no plugin)', () => {
        const plainEngine = new GaoViewEngine({
            viewsPath: '/tmp/views',
        });
        const template = `<h1>\${title}</h1>`;
        const result = plainEngine.renderString(template, { title: 'Hello' });
        expect(result).toBe('<h1>Hello</h1>');
    });

    it('directives should be no-op without UI helpers', () => {
        const plainEngine = new GaoViewEngine({
            viewsPath: '/tmp/views',
        });
        const template = `before@fonts(['GaoSans'])after`;
        const result = plainEngine.renderString(template);
        // The directive should silently produce nothing (typeof check fails)
        expect(result).toBe('beforeafter');
    });

    // ─── addHelpers() runtime injection ──────────────────────

    it('addHelpers() should inject helpers at runtime', () => {
        const freshEngine = new GaoViewEngine({
            viewsPath: '/tmp/views',
        });
        // Initially no UI helpers
        freshEngine.addHelpers({
            gaoIcon: (name: string) => `<svg><use href="#${name}"/></svg>`,
        });

        const template = `!{gaoIcon('star')}`;
        const result = freshEngine.renderString(template);
        expect(result).toContain('#star');
    });
});
