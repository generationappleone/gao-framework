/**
 * @gao/ui — Animation Library Tests
 *
 * Tests for the animation registry and all animation sets.
 */

import { describe, it, expect } from 'vitest';
import {
    getAnimation,
    getAllAnimationNames,
    animationCount,
    gaoAnimate,
    gaoAnimateCSS,
    injectAnimations,
    injectScrollReveal,
} from '../src/animations/animation-registry.js';
import { entranceAnimations } from '../src/animations/sets/entrances.js';
import { exitAnimations } from '../src/animations/sets/exits.js';
import { attentionAnimations } from '../src/animations/sets/attention.js';
import { loaderAnimations } from '../src/animations/sets/loaders.js';
import { scrollRevealAnimations } from '../src/animations/sets/scroll-reveal.js';

// ─── Animation Sets ──────────────────────────────────────────

describe('Entrance Animations', () => {
    it('should have 20 entrance animations', () => {
        expect(Object.keys(entranceAnimations)).toHaveLength(20);
    });

    it('should contain @keyframes for fadeIn', () => {
        expect(entranceAnimations.fadeIn).toContain('@keyframes gao-fadeIn');
    });
});

describe('Exit Animations', () => {
    it('should have 15 exit animations', () => {
        expect(Object.keys(exitAnimations)).toHaveLength(15);
    });

    it('should contain @keyframes for fadeOut', () => {
        expect(exitAnimations.fadeOut).toContain('@keyframes gao-fadeOut');
    });
});

describe('Attention Animations', () => {
    it('should have 12 attention animations', () => {
        expect(Object.keys(attentionAnimations)).toHaveLength(12);
    });

    it('should contain @keyframes for pulse', () => {
        expect(attentionAnimations.pulse).toContain('@keyframes gao-pulse');
    });
});

describe('Loader Animations', () => {
    it('should have 8 loader animations', () => {
        expect(Object.keys(loaderAnimations)).toHaveLength(8);
    });

    it('should contain @keyframes for shimmer', () => {
        expect(loaderAnimations.shimmer).toContain('@keyframes gao-shimmer');
    });
});

describe('Scroll Reveal Animations', () => {
    it('should have 11 scroll reveal animations', () => {
        expect(Object.keys(scrollRevealAnimations)).toHaveLength(11);
    });

    it('should contain @keyframes for revealUp', () => {
        expect(scrollRevealAnimations.revealUp).toContain('@keyframes gao-revealUp');
    });
});

// ─── Animation Registry ──────────────────────────────────────

describe('Animation Registry', () => {
    it('should have 66 total animations (20+15+12+8+11)', () => {
        expect(animationCount()).toBe(66);
    });

    it('should return all animation names', () => {
        const names = getAllAnimationNames();
        expect(names).toContain('fadeIn');
        expect(names).toContain('fadeOut');
        expect(names).toContain('bounce');
        expect(names).toContain('shimmer');
        expect(names).toContain('revealUp');
    });

    it('getAnimation() should return keyframes for known animation', () => {
        const css = getAnimation('fadeInUp');
        expect(css).toContain('@keyframes gao-fadeInUp');
    });

    it('getAnimation() should return undefined for unknown', () => {
        expect(getAnimation('nonexistent' as any)).toBeUndefined();
    });
});

// ─── gaoAnimate() ────────────────────────────────────────────

describe('gaoAnimate()', () => {
    it('should generate class + keyframes CSS', () => {
        const { css, className } = gaoAnimate('fadeIn');
        expect(className).toBe('gao-anim-fadeIn');
        expect(css).toContain('@keyframes gao-fadeIn');
        expect(css).toContain('.gao-anim-fadeIn');
    });

    it('should apply custom duration', () => {
        const { css } = gaoAnimate('fadeIn', { duration: 1000 });
        expect(css).toContain('1000ms');
    });

    it('should return empty for unknown animation', () => {
        const { css, className } = gaoAnimate('nonexistent' as any);
        expect(css).toBe('');
        expect(className).toBe('');
    });
});

// ─── gaoAnimateCSS() ─────────────────────────────────────────

describe('gaoAnimateCSS()', () => {
    it('should generate CSS for multiple animations', () => {
        const css = gaoAnimateCSS(['fadeIn', 'slideInUp', 'bounce']);
        expect(css).toContain('gao-fadeIn');
        expect(css).toContain('gao-slideInUp');
        expect(css).toContain('gao-bounce');
    });
});

// ─── injectAnimations() ──────────────────────────────────────

describe('injectAnimations()', () => {
    it('should generate <style> tag with all animations', () => {
        const html = injectAnimations();
        expect(html).toContain('<style id="gao-animations">');
        expect(html).toContain('</style>');
        expect(html).toContain('gao-fadeIn');
        expect(html).toContain('gao-bounce');
    });

    it('should generate <style> with specific animations only', () => {
        const html = injectAnimations(['fadeIn', 'fadeOut']);
        expect(html).toContain('gao-fadeIn');
        expect(html).toContain('gao-fadeOut');
        expect(html).not.toContain('gao-bounce');
    });
});

// ─── Scroll Reveal Script ────────────────────────────────────

describe('injectScrollReveal()', () => {
    it('should generate <script> tag with IntersectionObserver', () => {
        const html = injectScrollReveal();
        expect(html).toContain('<script id="gao-scroll-reveal">');
        expect(html).toContain('IntersectionObserver');
        expect(html).toContain('data-gao-reveal');
    });
});
