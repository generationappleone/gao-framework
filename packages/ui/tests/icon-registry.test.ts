/**
 * @gao/ui — Icon Registry Tests (12 tests)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    gaoIcon, gaoIconSprite, getAllIconNames, iconCount,
    getIconsByCategory, hasIcon, clearIconRegistry,
    registerIcon,
} from '../src/icons/icon-registry.js';
import type { GaoIconData, GaoIconName } from '../src/icons/icon-types.js';

function loadAllSets() {
    return Promise.all([
        import('../src/icons/sets/navigation.js'),
        import('../src/icons/sets/actions.js'),
        import('../src/icons/sets/media.js'),
        import('../src/icons/sets/social.js'),
        import('../src/icons/sets/data.js'),
        import('../src/icons/sets/status.js'),
        import('../src/icons/sets/commerce.js'),
        import('../src/icons/sets/device.js'),
        import('../src/icons/sets/nature.js'),
        import('../src/icons/sets/misc.js'),
    ]);
}

describe('IconRegistry', () => {
    beforeEach(() => { clearIconRegistry(); });

    it('should render a basic icon SVG', async () => {
        registerIcon('home' as GaoIconName, { path: 'M3 12l9-9 9 9' }, 'navigation');
        const svg = gaoIcon('home' as GaoIconName);
        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox="0 0 24 24"');
        expect(svg).toContain('<path d="M3 12l9-9 9 9"');
        expect(svg).toContain('class="gao-icon gao-icon-home"');
    });

    it('should apply size, color, and class options', async () => {
        registerIcon('edit' as GaoIconName, { path: 'M0 0' }, 'actions');
        const svg = gaoIcon('edit' as GaoIconName, { size: 32, color: '#ff0000', class: 'my-icon' });
        expect(svg).toContain('width="32"');
        expect(svg).toContain('height="32"');
        expect(svg).toContain('stroke="#ff0000"');
        expect(svg).toContain('my-icon');
    });

    it('should use currentColor by default', () => {
        registerIcon('check' as GaoIconName, { path: 'M0 0' }, 'actions');
        const svg = gaoIcon('check' as GaoIconName);
        expect(svg).toContain('stroke="currentColor"');
    });

    it('should add spin class when spin=true', () => {
        registerIcon('loader' as GaoIconName, { path: 'M0 0' }, 'status');
        const svg = gaoIcon('loader' as GaoIconName, { spin: true });
        expect(svg).toContain('gao-icon-spin');
    });

    it('should add accessibility title', () => {
        registerIcon('search' as GaoIconName, { path: 'M0 0' }, 'actions');
        const svg = gaoIcon('search' as GaoIconName, { title: 'Search items' });
        expect(svg).toContain('<title>Search items</title>');
        expect(svg).toContain('aria-hidden="false"');
    });

    it('should add id attribute', () => {
        registerIcon('star' as GaoIconName, { path: 'M0 0' }, 'social');
        const svg = gaoIcon('star' as GaoIconName, { id: 'fav-icon' });
        expect(svg).toContain('id="fav-icon"');
    });

    it('should throw for missing icon', () => {
        expect(() => gaoIcon('nonexistent' as GaoIconName)).toThrow('not found');
    });

    it('should handle weight variants', () => {
        registerIcon('home' as GaoIconName, { path: 'M0 0' }, 'navigation');
        const light = gaoIcon('home' as GaoIconName, { weight: 'light' });
        const bold = gaoIcon('home' as GaoIconName, { weight: 'bold' });
        expect(light).toContain('stroke-width="1"');
        expect(bold).toContain('stroke-width="2.5"');
    });

    it('should render accent path for dual-tone', () => {
        registerIcon('heart' as GaoIconName, { path: 'M0 0', accentPath: 'M1 1' }, 'social');
        const svg = gaoIcon('heart' as GaoIconName);
        expect(svg).toContain('opacity="0.15"');
        expect(svg).toContain('d="M1 1"');
    });

    it('should generate sprite with <defs>', () => {
        registerIcon('home' as GaoIconName, { path: 'M0 0' }, 'navigation');
        registerIcon('edit' as GaoIconName, { path: 'M1 1' }, 'actions');
        const sprite = gaoIconSprite(['home' as GaoIconName, 'edit' as GaoIconName]);
        expect(sprite).toContain('<defs>');
        expect(sprite).toContain('id="gao-icon-home"');
        expect(sprite).toContain('id="gao-icon-edit"');
        expect(sprite).toContain('style="display:none"');
    });

    it('should list all icon names', () => {
        registerIcon('home' as GaoIconName, { path: 'M0 0' }, 'navigation');
        registerIcon('edit' as GaoIconName, { path: 'M1 1' }, 'actions');
        const names = getAllIconNames();
        expect(names).toContain('home');
        expect(names).toContain('edit');
        expect(names).toHaveLength(2);
    });

    it('should check icon existence with hasIcon', () => {
        registerIcon('home' as GaoIconName, { path: 'M0 0' }, 'navigation');
        expect(hasIcon('home')).toBe(true);
        expect(hasIcon('nonexistent')).toBe(false);
    });
});
