/**
 * @gao/ui — Theme Presets
 *
 * 7 built-in theme presets for the GAO theme engine.
 * Default: 'gao' — White + Black + Slightly Dark Blue.
 *
 * @since 0.6.0
 */

import type { GaoThemeConfig, GaoThemePresetName } from './theme-types.js';

// ─── Preset Definitions ──────────────────────────────────────

/**
 * GAO Corporate Identity (DEFAULT)
 * White surfaces, black text, slightly dark blue primary.
 * Professional, enterprise-grade.
 */
const GAO_THEME: GaoThemeConfig = {
    name: 'gao',
    colors: {
        primary: { h: 215, s: 70, l: 40 },
        accent: { h: 215, s: 50, l: 50 },
    },
    radius: 'md',
    density: 'comfortable',
};

/**
 * Ocean — Blue-cyan palette.
 * Clear, refreshing, tech-forward.
 */
const OCEAN_THEME: GaoThemeConfig = {
    name: 'ocean',
    colors: {
        primary: { h: 200, s: 85, l: 50 },
        accent: { h: 180, s: 60, l: 45 },
    },
    radius: 'md',
    density: 'comfortable',
};

/**
 * Forest — Green palette.
 * Natural, calming, environmental.
 */
const FOREST_THEME: GaoThemeConfig = {
    name: 'forest',
    colors: {
        primary: { h: 152, s: 60, l: 38 },
        accent: { h: 120, s: 40, l: 50 },
    },
    radius: 'lg',
    density: 'comfortable',
};

/**
 * Sunset — Orange-red palette.
 * Warm, energetic, creative.
 */
const SUNSET_THEME: GaoThemeConfig = {
    name: 'sunset',
    colors: {
        primary: { h: 20, s: 85, l: 52 },
        accent: { h: 350, s: 75, l: 55 },
    },
    radius: 'md',
    density: 'comfortable',
};

/**
 * Midnight — Purple palette.
 * Premium, mysterious, luxurious.
 */
const MIDNIGHT_THEME: GaoThemeConfig = {
    name: 'midnight',
    colors: {
        primary: { h: 270, s: 65, l: 50 },
        accent: { h: 250, s: 55, l: 60 },
    },
    radius: 'lg',
    density: 'comfortable',
};

/**
 * Rose — Pink palette.
 * Soft, modern, approachable.
 */
const ROSE_THEME: GaoThemeConfig = {
    name: 'rose',
    colors: {
        primary: { h: 340, s: 70, l: 52 },
        accent: { h: 320, s: 60, l: 48 },
    },
    radius: 'lg',
    density: 'comfortable',
};

/**
 * Slate — Neutral gray palette.
 * Minimal, understated, monochrome.
 */
const SLATE_THEME: GaoThemeConfig = {
    name: 'slate',
    colors: {
        primary: { h: 215, s: 15, l: 35 },
        accent: { h: 215, s: 20, l: 50 },
    },
    radius: 'sm',
    density: 'comfortable',
};

// ─── Preset Registry ─────────────────────────────────────────

/**
 * All available preset themes indexed by name.
 */
export const GAO_THEMES: Record<GaoThemePresetName, GaoThemeConfig> = {
    gao: GAO_THEME,
    ocean: OCEAN_THEME,
    forest: FOREST_THEME,
    sunset: SUNSET_THEME,
    midnight: MIDNIGHT_THEME,
    rose: ROSE_THEME,
    slate: SLATE_THEME,
};

/**
 * Get a preset theme by name.
 *
 * @param name - Preset theme name
 * @returns Theme config or undefined if not found
 */
export function getPresetTheme(name: GaoThemePresetName): GaoThemeConfig | undefined {
    return GAO_THEMES[name];
}

/**
 * List all available preset theme names.
 */
export function getPresetNames(): GaoThemePresetName[] {
    return Object.keys(GAO_THEMES) as GaoThemePresetName[];
}
