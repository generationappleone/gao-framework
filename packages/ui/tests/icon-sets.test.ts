/**
 * @gao/ui — Icon Sets Integration Tests (10 tests)
 *
 * Note: Icon sets self-register on first import (side-effect).
 * ES module caching means we can't clear + re-import. Instead,
 * we import all sets once in beforeAll and verify the full catalog.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
    getAllIconNames, iconCount, getIconsByCategory,
    getAllCategories, gaoIcon, clearIconRegistry,
} from '../src/icons/icon-registry.js';

// Import all sets — triggers registerIconSet() side effects
import '../src/icons/sets/navigation.js';
import '../src/icons/sets/actions.js';
import '../src/icons/sets/media.js';
import '../src/icons/sets/social.js';
import '../src/icons/sets/data.js';
import '../src/icons/sets/status.js';
import '../src/icons/sets/commerce.js';
import '../src/icons/sets/device.js';
import '../src/icons/sets/nature.js';
import '../src/icons/sets/misc.js';

describe('Icon Sets — Integration', () => {
    it('should have exactly 200 icons total', () => {
        expect(iconCount()).toBe(200);
    });

    it('should have 10 categories', () => {
        const cats = getAllCategories();
        expect(cats).toHaveLength(10);
        expect(cats).toContain('navigation');
        expect(cats).toContain('actions');
        expect(cats).toContain('media');
        expect(cats).toContain('social');
        expect(cats).toContain('data');
        expect(cats).toContain('status');
        expect(cats).toContain('commerce');
        expect(cats).toContain('device');
        expect(cats).toContain('nature');
        expect(cats).toContain('misc');
    });

    it('should have 20 icons per category', () => {
        for (const cat of getAllCategories()) {
            const icons = getIconsByCategory(cat);
            expect(icons, `Category "${cat}" should have 20 icons`).toHaveLength(20);
        }
    });

    it('should have no duplicate icon names across sets', () => {
        const names = getAllIconNames();
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(names.length);
    });

    it('should render every icon without error', () => {
        const names = getAllIconNames();
        for (const name of names) {
            expect(() => gaoIcon(name)).not.toThrow();
        }
    });

    it('every icon SVG should have correct viewBox', () => {
        const names = getAllIconNames();
        for (const name of names) {
            const svg = gaoIcon(name);
            expect(svg).toContain('viewBox="0 0 24 24"');
        }
    });

    it('every icon SVG should have a valid path', () => {
        const names = getAllIconNames();
        for (const name of names) {
            const svg = gaoIcon(name);
            expect(svg).toMatch(/<path d="[^"]+"/);
        }
    });

    it('every icon should have role="img"', () => {
        const names = getAllIconNames();
        for (const name of names) {
            const svg = gaoIcon(name);
            expect(svg).toContain('role="img"');
        }
    });

    it('should include navigation icons', () => {
        const navIcons = getIconsByCategory('navigation');
        expect(navIcons).toContain('home');
        expect(navIcons).toContain('menu');
        expect(navIcons).toContain('arrow-up');
    });

    it('should include action icons', () => {
        const actionIcons = getIconsByCategory('actions');
        expect(actionIcons).toContain('edit');
        expect(actionIcons).toContain('save');
        expect(actionIcons).toContain('search');
    });
});
