/**
 * @gao/ui — Theme Types
 *
 * TypeScript interfaces for the theme engine configuration.
 *
 * @since 0.6.0
 */

// ─── HSL Color ───────────────────────────────────────────────

/**
 * HSL color representation for programmatic manipulation.
 */
export interface GaoHSLColor {
    /** Hue: 0-360 */
    h: number;
    /** Saturation: 0-100 (without %) */
    s: number;
    /** Lightness: 0-100 (without %) */
    l: number;
}

// ─── Theme Colors ────────────────────────────────────────────

/**
 * Color configuration for a theme.
 * Only `primary` is required — all other colors auto-derive from primary.
 */
export interface GaoThemeColors {
    /** Primary brand color (required). */
    primary: GaoHSLColor;
    /** Secondary color. Default: primary.h + 30° */
    secondary?: GaoHSLColor;
    /** Accent color. Default: primary.h + 40° */
    accent?: GaoHSLColor;
    /** Success color. Default: hsl(152, 60%, 42%) */
    success?: GaoHSLColor;
    /** Warning color. Default: hsl(38, 92%, 50%) */
    warning?: GaoHSLColor;
    /** Danger color. Default: hsl(350, 72%, 52%) */
    danger?: GaoHSLColor;
    /** Info color. Default: hsl(200, 80%, 50%) */
    info?: GaoHSLColor;
}

// ─── Theme Config ────────────────────────────────────────────

/**
 * Complete theme configuration.
 */
export interface GaoThemeConfig {
    /** Theme name identifier (e.g., 'gao', 'ocean', 'midnight'). */
    name: string;
    /** Color settings for the theme. */
    colors: GaoThemeColors;
    /** Border radius preset. Default: 'md' */
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    /** Component density. Default: 'comfortable' */
    density?: 'compact' | 'comfortable' | 'spacious';
    /** Override --gao-font-sans font family. */
    fontFamily?: string;
}

// ─── Theme Preset Name ───────────────────────────────────────

/**
 * Built-in theme preset names.
 */
export type GaoThemePresetName = 'gao' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'rose' | 'slate';
