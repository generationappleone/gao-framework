/**
 * @gao/ui — Animation Registry
 *
 * Central registry for all ~65 CSS animations.
 * Registry pattern — same as font-registry and icon-registry.
 *
 * @since 0.6.0
 */

import type { GaoAnimationName, GaoAnimationConfig } from './animation-types.js';
import { entranceAnimations } from './sets/entrances.js';
import { exitAnimations } from './sets/exits.js';
import { attentionAnimations } from './sets/attention.js';
import { loaderAnimations } from './sets/loaders.js';
import { scrollRevealAnimations, scrollRevealScript } from './sets/scroll-reveal.js';

// ─── Registry ────────────────────────────────────────────────

const ALL_ANIMATIONS: Record<string, string> = {
    ...entranceAnimations,
    ...exitAnimations,
    ...attentionAnimations,
    ...loaderAnimations,
    ...scrollRevealAnimations,
};

// ─── Public API ──────────────────────────────────────────────

/**
 * Get the @keyframes CSS for a single animation.
 *
 * @param name - Animation name
 * @returns CSS @keyframes string or undefined
 */
export function getAnimation(name: GaoAnimationName): string | undefined {
    return ALL_ANIMATIONS[name];
}

/**
 * Get all registered animation names.
 */
export function getAllAnimationNames(): string[] {
    return Object.keys(ALL_ANIMATIONS);
}

/**
 * Get total animation count.
 */
export function animationCount(): number {
    return Object.keys(ALL_ANIMATIONS).length;
}

/**
 * Generate CSS class and @keyframes for a specific animation.
 *
 * @param name - Animation name
 * @param config - Animation configuration
 * @returns Object with `css` (style block) and `className` (class to apply)
 */
export function gaoAnimate(name: GaoAnimationName, config: GaoAnimationConfig = {}): { css: string; className: string } {
    const {
        duration = 600,
        delay = 0,
        easing = 'ease',
        iterationCount = 1,
        fillMode = 'both',
    } = config;

    const keyframes = ALL_ANIMATIONS[name];
    if (!keyframes) {
        return { css: '', className: '' };
    }

    const className = `gao-anim-${name}`;
    const css = `${keyframes}\n.${className} { animation: gao-${name} ${duration}ms ${easing} ${delay}ms ${iterationCount} ${fillMode}; }`;

    return { css, className };
}

/**
 * Generate CSS for multiple animations at once.
 *
 * @param names - Array of animation names
 * @param config - Shared configuration
 * @returns Complete CSS string
 */
export function gaoAnimateCSS(names: GaoAnimationName[], config: GaoAnimationConfig = {}): string {
    return names.map(name => gaoAnimate(name, config).css).filter(Boolean).join('\n\n');
}

/**
 * Generate a `<style>` tag with all (or specified) animations.
 *
 * @param names - Optional array of specific animations. If omitted, includes ALL.
 * @returns HTML `<style>` tag
 */
export function injectAnimations(names?: GaoAnimationName[]): string {
    const animNames = names ?? (getAllAnimationNames() as GaoAnimationName[]);
    const css = gaoAnimateCSS(animNames);
    return `<style id="gao-animations">\n${css}\n</style>`;
}

/**
 * Generate `<script>` tag with scroll reveal observer.
 */
export function injectScrollReveal(): string {
    return `<script id="gao-scroll-reveal">\n${scrollRevealScript()}\n</script>`;
}
