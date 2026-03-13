/**
 * @gao/ui — Design Tokens Tests
 *
 * Tests for design system CSS tokens, utilities, typography,
 * responsive system, and the aggregator.
 */

import { describe, it, expect } from 'vitest';
import {
    designTokensCSS,
    colorTokensCSS,
    spacingTokensCSS,
    radiusTokensCSS,
    shadowTokensCSS,
    zIndexTokensCSS,
    transitionTokensCSS,
    typographyTokensCSS,
} from '../src/styles/design-tokens.js';
import { resetCSS } from '../src/styles/reset.js';
import { typographyCSS } from '../src/styles/typography.js';
import { utilitiesCSS } from '../src/styles/utilities.js';
import { responsiveCSS } from '../src/styles/responsive.js';
import { gaoStyles, injectStyles } from '../src/styles/index.js';

// ─── Color Tokens ────────────────────────────────────────────

describe('Color Tokens', () => {
    it('should contain GAO corporate primary hue 215', () => {
        expect(colorTokensCSS).toContain('--gao-primary-h: 215');
    });

    it('should contain primary HSL(215, 70%, 40%) — slightly dark blue', () => {
        expect(colorTokensCSS).toContain('--gao-primary-s: 70%');
        expect(colorTokensCSS).toContain('--gao-primary-l: 40%');
    });

    it('should contain all primary variants', () => {
        expect(colorTokensCSS).toContain('--gao-primary:');
        expect(colorTokensCSS).toContain('--gao-primary-light:');
        expect(colorTokensCSS).toContain('--gao-primary-dark:');
        expect(colorTokensCSS).toContain('--gao-primary-bg:');
    });

    it('should contain semantic colors (success, warning, danger, info)', () => {
        expect(colorTokensCSS).toContain('--gao-success:');
        expect(colorTokensCSS).toContain('--gao-warning:');
        expect(colorTokensCSS).toContain('--gao-danger:');
        expect(colorTokensCSS).toContain('--gao-info:');
    });

    it('should contain complete neutral gray scale (50-950)', () => {
        expect(colorTokensCSS).toContain('--gao-gray-50:');
        expect(colorTokensCSS).toContain('--gao-gray-100:');
        expect(colorTokensCSS).toContain('--gao-gray-200:');
        expect(colorTokensCSS).toContain('--gao-gray-300:');
        expect(colorTokensCSS).toContain('--gao-gray-400:');
        expect(colorTokensCSS).toContain('--gao-gray-500:');
        expect(colorTokensCSS).toContain('--gao-gray-600:');
        expect(colorTokensCSS).toContain('--gao-gray-700:');
        expect(colorTokensCSS).toContain('--gao-gray-800:');
        expect(colorTokensCSS).toContain('--gao-gray-900:');
        expect(colorTokensCSS).toContain('--gao-gray-950:');
    });

    it('should contain dark mode overrides', () => {
        expect(colorTokensCSS).toContain('[data-theme="dark"]');
        expect(colorTokensCSS).toContain('prefers-color-scheme: dark');
    });

    it('should contain surface tokens for white branding', () => {
        expect(colorTokensCSS).toContain('--gao-surface: #ffffff');
        expect(colorTokensCSS).toContain('--gao-bg:');
    });

    it('should contain near-black text tokens', () => {
        expect(colorTokensCSS).toContain('--gao-text:');
        expect(colorTokensCSS).toContain('--gao-text-secondary:');
        expect(colorTokensCSS).toContain('--gao-text-muted:');
    });
});

// ─── Spacing Tokens ──────────────────────────────────────────

describe('Spacing Tokens', () => {
    it('should contain spacing scale from 1 to 16', () => {
        expect(spacingTokensCSS).toContain('--gao-space-1:');
        expect(spacingTokensCSS).toContain('--gao-space-4:');
        expect(spacingTokensCSS).toContain('--gao-space-8:');
        expect(spacingTokensCSS).toContain('--gao-space-12:');
        expect(spacingTokensCSS).toContain('--gao-space-16:');
    });
});

// ─── Radius Tokens ───────────────────────────────────────────

describe('Radius Tokens', () => {
    it('should contain radius scale from none to full', () => {
        expect(radiusTokensCSS).toContain('--gao-radius-none:');
        expect(radiusTokensCSS).toContain('--gao-radius-sm:');
        expect(radiusTokensCSS).toContain('--gao-radius-md:');
        expect(radiusTokensCSS).toContain('--gao-radius-lg:');
        expect(radiusTokensCSS).toContain('--gao-radius-xl:');
        expect(radiusTokensCSS).toContain('--gao-radius-full:');
    });
});

// ─── Shadow Tokens ───────────────────────────────────────────

describe('Shadow Tokens', () => {
    it('should contain shadow scale from xs to 2xl', () => {
        expect(shadowTokensCSS).toContain('--gao-shadow-xs:');
        expect(shadowTokensCSS).toContain('--gao-shadow-sm:');
        expect(shadowTokensCSS).toContain('--gao-shadow-md:');
        expect(shadowTokensCSS).toContain('--gao-shadow-lg:');
        expect(shadowTokensCSS).toContain('--gao-shadow-xl:');
        expect(shadowTokensCSS).toContain('--gao-shadow-2xl:');
    });
});

// ─── Z-Index Tokens ──────────────────────────────────────────

describe('Z-Index Tokens', () => {
    it('should contain z-index scale', () => {
        expect(zIndexTokensCSS).toContain('--gao-z-base:');
        expect(zIndexTokensCSS).toContain('--gao-z-dropdown:');
        expect(zIndexTokensCSS).toContain('--gao-z-modal:');
        expect(zIndexTokensCSS).toContain('--gao-z-toast:');
        expect(zIndexTokensCSS).toContain('--gao-z-tooltip:');
    });
});

// ─── Transition Tokens ───────────────────────────────────────

describe('Transition Tokens', () => {
    it('should contain transition presets', () => {
        expect(transitionTokensCSS).toContain('--gao-transition-fast:');
        expect(transitionTokensCSS).toContain('--gao-transition-base:');
        expect(transitionTokensCSS).toContain('--gao-transition-slow:');
    });

    it('should contain reduced-motion media query', () => {
        expect(transitionTokensCSS).toContain('prefers-reduced-motion: reduce');
    });
});

// ─── Reset CSS ───────────────────────────────────────────────

describe('Reset CSS', () => {
    it('should contain box-sizing border-box', () => {
        expect(resetCSS).toContain('box-sizing: border-box');
    });

    it('should contain smooth scroll with reduced-motion fallback', () => {
        expect(resetCSS).toContain('scroll-behavior: smooth');
        expect(resetCSS).toContain('prefers-reduced-motion');
    });

    it('should contain focus-visible outline using primary color', () => {
        expect(resetCSS).toContain(':focus-visible');
        expect(resetCSS).toContain('--gao-primary');
    });
});

// ─── Typography CSS ──────────────────────────────────────────

describe('Typography CSS', () => {
    it('should contain heading classes h1-h6', () => {
        expect(typographyCSS).toContain('.gao-h1');
        expect(typographyCSS).toContain('.gao-h2');
        expect(typographyCSS).toContain('.gao-h3');
        expect(typographyCSS).toContain('.gao-h4');
        expect(typographyCSS).toContain('.gao-h5');
        expect(typographyCSS).toContain('.gao-h6');
    });

    it('should use fluid typography with clamp()', () => {
        expect(typographyCSS).toContain('clamp(');
    });

    it('should contain body text classes', () => {
        expect(typographyCSS).toContain('.gao-body');
        expect(typographyCSS).toContain('.gao-lead');
        expect(typographyCSS).toContain('.gao-small');
        expect(typographyCSS).toContain('.gao-caption');
    });
});

// ─── Utilities CSS ───────────────────────────────────────────

describe('Utilities CSS', () => {
    it('should contain display utilities', () => {
        expect(utilitiesCSS).toContain('.gao-flex');
        expect(utilitiesCSS).toContain('.gao-grid');
        expect(utilitiesCSS).toContain('.gao-block');
        expect(utilitiesCSS).toContain('.gao-hidden');
    });

    it('should contain spacing utilities', () => {
        expect(utilitiesCSS).toContain('.gao-m-1');
        expect(utilitiesCSS).toContain('.gao-p-4');
        expect(utilitiesCSS).toContain('.gao-mt-4');
        expect(utilitiesCSS).toContain('.gao-mb-6');
    });

    it('should contain text alignment utilities', () => {
        expect(utilitiesCSS).toContain('.gao-text-center');
        expect(utilitiesCSS).toContain('.gao-text-left');
        expect(utilitiesCSS).toContain('.gao-text-right');
    });

    it('should contain color utilities', () => {
        expect(utilitiesCSS).toContain('.gao-text-primary');
        expect(utilitiesCSS).toContain('.gao-bg-primary');
        expect(utilitiesCSS).toContain('.gao-text-success');
    });
});

// ─── Responsive CSS ──────────────────────────────────────────

describe('Responsive CSS', () => {
    it('should contain container classes', () => {
        expect(responsiveCSS).toContain('.gao-container');
        expect(responsiveCSS).toContain('.gao-container-sm');
        expect(responsiveCSS).toContain('.gao-container-xl');
    });

    it('should contain grid classes 1-6', () => {
        expect(responsiveCSS).toContain('.gao-grid-1');
        expect(responsiveCSS).toContain('.gao-grid-3');
        expect(responsiveCSS).toContain('.gao-grid-6');
    });

    it('should contain auto-responsive grid', () => {
        expect(responsiveCSS).toContain('.gao-grid-auto');
        expect(responsiveCSS).toContain('auto-fill');
        expect(responsiveCSS).toContain('minmax(280px');
    });

    it('should contain responsive breakpoint media queries', () => {
        expect(responsiveCSS).toContain('@media (max-width: 768px)');
        expect(responsiveCSS).toContain('@media (max-width: 1024px)');
    });
});

// ─── Aggregator ──────────────────────────────────────────────

describe('gaoStyles() Aggregator', () => {
    it('should combine all modules by default', () => {
        const css = gaoStyles();
        expect(css).toContain('box-sizing: border-box');     // reset
        expect(css).toContain('--gao-primary-h: 215');       // tokens
        expect(css).toContain('.gao-h1');                    // typography
        expect(css).toContain('.gao-flex');                   // utilities
        expect(css).toContain('.gao-container');              // responsive
    });

    it('should allow selective inclusion', () => {
        const css = gaoStyles({ reset: true, tokens: true, typography: false, utilities: false, responsive: false });
        expect(css).toContain('box-sizing: border-box');
        expect(css).toContain('--gao-primary-h: 215');
        expect(css).not.toContain('.gao-h1');
        expect(css).not.toContain('.gao-flex');
        expect(css).not.toContain('.gao-container');
    });

    it('should generate style tag via injectStyles()', () => {
        const html = injectStyles();
        expect(html).toContain('<style id="gao-design-system">');
        expect(html).toContain('</style>');
        expect(html).toContain('--gao-primary-h: 215');
    });
});
