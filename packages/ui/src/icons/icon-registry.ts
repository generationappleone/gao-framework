/**
 * @gao/ui — Icon Registry
 *
 * Renders GaoIcons as inline SVG strings. Supports sizing, color,
 * weight variants, animations, sprites, and accessibility.
 *
 * Design: Dual-tone icons (outline + accent fill), 24×24 grid,
 * 1.5px default stroke, 3px corner radius.
 */

import type { GaoIconName, GaoIconData, GaoIconOptions, GaoIconCategory } from './icon-types.js';

// ─── Icon Store ──────────────────────────────────────────────

const icons = new Map<GaoIconName, GaoIconData>();
const categoryMap = new Map<GaoIconCategory, GaoIconName[]>();

/**
 * Register an icon in the global store.
 * Called internally by each icon set module.
 */
export function registerIcon(name: GaoIconName, data: GaoIconData, category: GaoIconCategory): void {
    icons.set(name, data);

    if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(name);
}

/**
 * Register a batch of icons for a category.
 */
export function registerIconSet(
    category: GaoIconCategory,
    set: Record<string, GaoIconData>,
): void {
    for (const [name, data] of Object.entries(set)) {
        registerIcon(name as GaoIconName, data, category);
    }
}

// ─── Stroke Width Map ────────────────────────────────────────

const STROKE_WEIGHTS: Record<NonNullable<GaoIconOptions['weight']>, number> = {
    light: 1,
    regular: 1.5,
    bold: 2.5,
};

// ─── CSS Animation Styles ────────────────────────────────────

const ICON_ANIMATIONS = `
<style id="gao-icon-animations">
@keyframes gao-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes gao-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
.gao-icon-spin { animation: gao-spin 1s linear infinite; }
.gao-icon-pulse { animation: gao-pulse 1.5s ease-in-out infinite; }
</style>`;

let animationInjected = false;

// ─── Render Functions ────────────────────────────────────────

/**
 * Render a single icon as an inline SVG string.
 *
 * @param name - Icon name from the GaoIconName union type
 * @param options - Optional rendering configuration
 * @returns SVG string ready for HTML injection
 *
 * @example
 * ```typescript
 * const svg = gaoIcon('home');
 * const svg = gaoIcon('check', { size: 20, color: '#22c55e', spin: true });
 * ```
 */
export function gaoIcon(name: GaoIconName, options: GaoIconOptions = {}): string {
    const data = icons.get(name);
    if (!data) {
        throw new Error(`Icon "${name}" not found. Available: ${getAllIconNames().length} icons registered.`);
    }

    const size = options.size ?? 24;
    const weight = STROKE_WEIGHTS[options.weight ?? 'regular'];
    const color = options.color ?? 'currentColor';
    const viewBox = data.viewBox ?? '0 0 24 24';
    const strokeWidth = data.strokeWidth ?? weight;

    // Build class list
    const classes: string[] = ['gao-icon', `gao-icon-${name}`];
    if (options.class) classes.push(options.class);
    if (options.spin) classes.push('gao-icon-spin');
    if (options.pulse) classes.push('gao-icon-pulse');

    // Build attributes
    const attrs: string[] = [
        `xmlns="http://www.w3.org/2000/svg"`,
        `width="${size}"`,
        `height="${size}"`,
        `viewBox="${viewBox}"`,
        `fill="none"`,
        `stroke="${color}"`,
        `stroke-width="${strokeWidth}"`,
        `stroke-linecap="round"`,
        `stroke-linejoin="round"`,
        `class="${classes.join(' ')}"`,
        `role="img"`,
        `aria-hidden="${options.title ? 'false' : 'true'}"`,
    ];

    if (options.id) attrs.push(`id="${options.id}"`);

    // Build inner content
    let inner = '';
    if (options.title) {
        inner += `<title>${escapeHtml(options.title)}</title>`;
    }
    inner += `<path d="${data.path}"/>`;

    // Accent path (dual-tone)
    if (data.accentPath) {
        inner += `<path d="${data.accentPath}" fill="${color}" opacity="0.15" stroke="none"/>`;
    }

    return `<svg ${attrs.join(' ')}>${inner}</svg>`;
}

/**
 * Generate an SVG sprite sheet with `<defs>` for `<use>` references.
 *
 * @param names - Array of icon names to include in the sprite
 * @returns SVG string with symbol definitions
 *
 * @example
 * ```html
 * <!-- Inject sprite once -->
 * {{ gaoIconSprite(['home', 'edit', 'search']) }}
 *
 * <!-- Use icons by reference -->
 * <svg width="24" height="24"><use href="#gao-icon-home"/></svg>
 * ```
 */
export function gaoIconSprite(names: GaoIconName[]): string {
    const symbols: string[] = [];

    for (const name of names) {
        const data = icons.get(name);
        if (!data) {
            throw new Error(`Icon "${name}" not found for sprite generation.`);
        }
        const viewBox = data.viewBox ?? '0 0 24 24';
        let paths = `<path d="${data.path}"/>`;
        if (data.accentPath) {
            paths += `<path d="${data.accentPath}" fill="currentColor" opacity="0.15" stroke="none"/>`;
        }
        symbols.push(`<symbol id="gao-icon-${name}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</symbol>`);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none"><defs>${symbols.join('')}</defs></svg>`;
}

/**
 * Get the icon animation CSS (should be injected once in <head>).
 */
export function gaoIconAnimationCSS(): string {
    if (animationInjected) return '';
    animationInjected = true;
    return ICON_ANIMATIONS;
}

// ─── Query Functions ─────────────────────────────────────────

/**
 * Get all registered icon names.
 */
export function getAllIconNames(): GaoIconName[] {
    return [...icons.keys()];
}

/**
 * Get icon names for a specific category.
 */
export function getIconsByCategory(category: GaoIconCategory): GaoIconName[] {
    return categoryMap.get(category) ?? [];
}

/**
 * Get all registered categories.
 */
export function getAllCategories(): GaoIconCategory[] {
    return [...categoryMap.keys()];
}

/**
 * Check if an icon is registered.
 */
export function hasIcon(name: string): name is GaoIconName {
    return icons.has(name as GaoIconName);
}

/**
 * Get total number of registered icons.
 */
export function iconCount(): number {
    return icons.size;
}

/**
 * Clear all registered icons (for testing).
 * @internal
 */
export function clearIconRegistry(): void {
    icons.clear();
    categoryMap.clear();
    animationInjected = false;
}

// ─── Utilities ───────────────────────────────────────────────

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
