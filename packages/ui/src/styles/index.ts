/**
 * @gao/ui — Styles Index
 *
 * Aggregator for the complete GAO design system.
 * Combines reset, tokens, typography, utilities, and responsive modules
 * into a single CSS output.
 *
 * @since 0.6.0
 */

import { designTokensCSS } from './design-tokens.js';
import { resetCSS } from './reset.js';
import { typographyCSS } from './typography.js';
import { utilitiesCSS } from './utilities.js';
import { responsiveCSS } from './responsive.js';

// ─── Configuration ───────────────────────────────────────────

/**
 * Options for selective CSS inclusion.
 */
export interface GaoStylesOptions {
    /** Include CSS reset. Default: true */
    reset?: boolean;
    /** Include design tokens. Default: true */
    tokens?: boolean;
    /** Include typography classes. Default: true */
    typography?: boolean;
    /** Include utility classes. Default: true */
    utilities?: boolean;
    /** Include responsive system. Default: true */
    responsive?: boolean;
}

// ─── Aggregator Function ─────────────────────────────────────

/**
 * Generate the complete GAO design system CSS.
 *
 * By default, includes all modules. Pass options to selectively
 * enable/disable specific modules.
 *
 * @param options - Selective inclusion options
 * @returns Complete CSS string combining all selected modules
 *
 * @example
 * ```typescript
 * // Full design system
 * const css = gaoStyles();
 *
 * // Only tokens + reset (no utility classes)
 * const css = gaoStyles({ utilities: false, typography: false, responsive: false });
 *
 * // Inject as <style> tag
 * const html = injectStyles();
 * ```
 */
export function gaoStyles(options: GaoStylesOptions = {}): string {
    const {
        reset = true,
        tokens = true,
        typography = true,
        utilities = true,
        responsive = true,
    } = options;

    const parts: string[] = [];

    if (reset) parts.push(resetCSS);
    if (tokens) parts.push(designTokensCSS);
    if (typography) parts.push(typographyCSS);
    if (utilities) parts.push(utilitiesCSS);
    if (responsive) parts.push(responsiveCSS);

    return parts.join('\n');
}

/**
 * Generate a `<style>` tag containing the full GAO design system CSS.
 *
 * @param options - Selective inclusion options
 * @returns HTML `<style>` tag with the design system CSS
 */
export function injectStyles(options: GaoStylesOptions = {}): string {
    return `<style id="gao-design-system">\n${gaoStyles(options)}\n</style>`;
}

// ─── Re-exports ──────────────────────────────────────────────

export { designTokensCSS, colorTokensCSS, spacingTokensCSS, radiusTokensCSS, shadowTokensCSS, zIndexTokensCSS, transitionTokensCSS, typographyTokensCSS } from './design-tokens.js';
export { resetCSS } from './reset.js';
export { typographyCSS } from './typography.js';
export { utilitiesCSS } from './utilities.js';
export { responsiveCSS } from './responsive.js';
