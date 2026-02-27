/**
 * @gao/ui — Font Registry
 *
 * Manages GaoType font families: registration, CSS @font-face generation,
 * and selective injection. All fonts are CSS-only with inline fallback stacks.
 *
 * Zero external dependencies — fonts are pure CSS custom properties + @font-face.
 */

// ─── Types ───────────────────────────────────────────────────

export interface GaoFontData {
    /** The CSS font-family name, e.g. 'GaoSans' */
    family: string;
    /** CSS @font-face declaration(s) — may include multiple weights */
    fontFace: string;
    /** Fallback font stack, e.g. "system-ui, -apple-system, sans-serif" */
    fallback: string;
    /** CSS custom property name, e.g. '--gao-font-sans' */
    cssVariable: string;
    /** Available font weights */
    weights: number[];
    /** Font category for grouping */
    category: 'sans' | 'mono' | 'display' | 'slab' | 'rounded' | 'condensed' | 'script' | 'pixel' | 'handwriting' | 'terminal';
    /** Additional CSS custom properties for font-specific settings */
    cssProperties: string;
}

export type GaoFontName =
    | 'GaoSans'
    | 'GaoMono'
    | 'GaoDisplay'
    | 'GaoSlab'
    | 'GaoRounded'
    | 'GaoCondensed'
    | 'GaoScript'
    | 'GaoPixel'
    | 'GaoHandwriting'
    | 'GaoTerminal';

// ─── Registry ────────────────────────────────────────────────

const registry = new Map<GaoFontName, GaoFontData>();

/**
 * Register a font in the global registry.
 * Called internally by each font module on import.
 */
export function registerFont(name: GaoFontName, data: GaoFontData): void {
    if (registry.has(name)) {
        throw new Error(`Font "${name}" is already registered`);
    }
    registry.set(name, data);
}

/**
 * Get a specific font's data.
 * @throws Error if font is not registered
 */
export function getFont(name: GaoFontName): GaoFontData {
    const font = registry.get(name);
    if (!font) {
        throw new Error(`Font "${name}" is not registered. Available: ${getAllFontNames().join(', ')}`);
    }
    return font;
}

/**
 * Get all registered font names.
 */
export function getAllFontNames(): GaoFontName[] {
    return [...registry.keys()];
}

/**
 * Get all registered font data.
 */
export function getAllFonts(): Map<GaoFontName, GaoFontData> {
    return new Map(registry);
}

/**
 * Generate CSS string containing @font-face declarations and CSS custom properties.
 *
 * @param names - Optional array of font names to include. If omitted, includes all registered fonts.
 * @returns Complete CSS string ready to inject into a `<style>` element.
 *
 * @example
 * ```typescript
 * // All fonts
 * const css = generateFontCSS();
 *
 * // Selective
 * const css = generateFontCSS(['GaoSans', 'GaoMono']);
 * ```
 */
export function generateFontCSS(names?: GaoFontName[]): string {
    const targetFonts = names
        ? names.map((n) => {
            const font = registry.get(n);
            if (!font) {
                throw new Error(`Font "${n}" is not registered. Available: ${getAllFontNames().join(', ')}`);
            }
            return font;
        })
        : [...registry.values()];

    if (targetFonts.length === 0) {
        return '/* No GaoType fonts registered */';
    }

    const sections: string[] = [
        '/* ═══════════════════════════════════════════════════════════',
        ' * GaoType — GAO Framework Built-in Font System',
        ` * Generated: ${targetFonts.length} font families`,
        ' * Zero external dependencies — all CSS-only',
        ' * ═══════════════════════════════════════════════════════════ */',
        '',
    ];

    // 1. @font-face declarations
    for (const font of targetFonts) {
        sections.push(`/* ── ${font.family} ── */`);
        sections.push(font.fontFace);
        sections.push('');
    }

    // 2. CSS custom properties (:root)
    const variables: string[] = [];
    const properties: string[] = [];

    for (const font of targetFonts) {
        variables.push(`  ${font.cssVariable}: '${font.family}', ${font.fallback};`);
        if (font.cssProperties) {
            properties.push(font.cssProperties);
        }
    }

    sections.push(':root {');
    sections.push(...variables);
    if (properties.length > 0) {
        sections.push('');
        sections.push('  /* Font-specific properties */');
        sections.push(...properties);
    }
    sections.push('}');

    return sections.join('\n');
}

/**
 * Generate a `<style>` HTML element containing the font CSS.
 * Convenience wrapper around `generateFontCSS()`.
 *
 * @param names - Optional array of font names to include
 * @returns HTML `<style>` element string
 */
export function injectFonts(names?: GaoFontName[]): string {
    const css = generateFontCSS(names);
    return `<style id="gao-fonts">\n${css}\n</style>`;
}

/**
 * Get the number of registered fonts.
 */
export function fontCount(): number {
    return registry.size;
}

/**
 * Clear all registered fonts (primarily for testing).
 * @internal
 */
export function clearFontRegistry(): void {
    registry.clear();
}
