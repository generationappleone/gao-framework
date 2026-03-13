/**
 * @gao/ui — Design Tokens
 *
 * Core CSS custom properties for the GAO design system.
 * GAO Corporate Identity: White + Black + Slightly Dark Blue (HSL 215°)
 *
 * All tokens use the `.gao-` prefix and HSL color model for
 * programmatic theme manipulation.
 *
 * @since 0.6.0
 */

// ─── Color Tokens ────────────────────────────────────────────

/**
 * Full semantic color system using GAO Corporate Identity.
 * Primary: Slightly Dark Blue hsl(215, 70%, 40%)
 * Neutral scale: Cool gray with 215° hue
 */
export const colorTokensCSS: string = `
/* ═══════════════════════════════════════════════════════════
 * GAO Design System v0.6.0 — Color Tokens
 * Corporate Identity: White + Black + Dark Blue
 * ═══════════════════════════════════════════════════════════ */

:root {
  /* ── Primary: Slightly Dark Blue ── */
  --gao-primary-h: 215;
  --gao-primary-s: 70%;
  --gao-primary-l: 40%;
  --gao-primary: hsl(var(--gao-primary-h), var(--gao-primary-s), var(--gao-primary-l));
  --gao-primary-light: hsl(var(--gao-primary-h), var(--gao-primary-s), 55%);
  --gao-primary-dark: hsl(var(--gao-primary-h), var(--gao-primary-s), 30%);
  --gao-primary-bg: hsl(var(--gao-primary-h), var(--gao-primary-s), 96%);

  /* ── Accent: Steel Blue ── */
  --gao-accent-h: 215;
  --gao-accent-s: 50%;
  --gao-accent-l: 50%;
  --gao-accent: hsl(var(--gao-accent-h), var(--gao-accent-s), var(--gao-accent-l));

  /* ── Semantic Colors ── */
  --gao-success: hsl(152, 60%, 42%);
  --gao-success-light: hsl(152, 60%, 60%);
  --gao-success-bg: hsl(152, 60%, 95%);
  --gao-warning: hsl(38, 92%, 50%);
  --gao-warning-light: hsl(38, 92%, 65%);
  --gao-warning-bg: hsl(38, 92%, 95%);
  --gao-danger: hsl(350, 72%, 52%);
  --gao-danger-light: hsl(350, 72%, 66%);
  --gao-danger-bg: hsl(350, 72%, 96%);
  --gao-info: hsl(200, 80%, 50%);
  --gao-info-light: hsl(200, 80%, 65%);
  --gao-info-bg: hsl(200, 80%, 96%);

  /* ── Neutral Scale (Cool Gray 215°) ── */
  --gao-gray-50: hsl(215, 15%, 97%);
  --gao-gray-100: hsl(215, 15%, 94%);
  --gao-gray-200: hsl(215, 14%, 88%);
  --gao-gray-300: hsl(215, 12%, 78%);
  --gao-gray-400: hsl(215, 10%, 62%);
  --gao-gray-500: hsl(215, 10%, 46%);
  --gao-gray-600: hsl(215, 12%, 34%);
  --gao-gray-700: hsl(215, 14%, 24%);
  --gao-gray-800: hsl(215, 18%, 16%);
  --gao-gray-900: hsl(215, 22%, 10%);
  --gao-gray-950: hsl(215, 28%, 6%);

  /* ── Surface (Light Mode) ── */
  --gao-bg: hsl(215, 15%, 97%);
  --gao-surface: #ffffff;
  --gao-surface-raised: #ffffff;
  --gao-surface-overlay: rgba(255, 255, 255, 0.8);
  --gao-border: hsl(215, 15%, 88%);
  --gao-border-light: hsl(215, 15%, 93%);

  /* ── Text (Near Black) ── */
  --gao-text: hsl(215, 25%, 8%);
  --gao-text-secondary: hsl(215, 10%, 40%);
  --gao-text-muted: hsl(215, 10%, 55%);
  --gao-text-inverse: #ffffff;
}

/* ── Dark Mode ── */
[data-theme="dark"],
.gao-dark {
  --gao-bg: hsl(215, 25%, 8%);
  --gao-surface: hsl(215, 20%, 12%);
  --gao-surface-raised: hsl(215, 20%, 16%);
  --gao-surface-overlay: rgba(15, 19, 24, 0.85);
  --gao-border: hsl(215, 15%, 22%);
  --gao-border-light: hsl(215, 15%, 18%);

  --gao-text: hsl(215, 15%, 94%);
  --gao-text-secondary: hsl(215, 10%, 62%);
  --gao-text-muted: hsl(215, 10%, 46%);

  --gao-success-bg: hsl(152, 60%, 12%);
  --gao-warning-bg: hsl(38, 92%, 12%);
  --gao-danger-bg: hsl(350, 72%, 12%);
  --gao-info-bg: hsl(200, 80%, 12%);
  --gao-primary-bg: hsl(var(--gao-primary-h), var(--gao-primary-s), 14%);

  --gao-gray-50: hsl(215, 18%, 14%);
  --gao-gray-100: hsl(215, 18%, 18%);
  --gao-gray-200: hsl(215, 15%, 22%);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --gao-bg: hsl(215, 25%, 8%);
    --gao-surface: hsl(215, 20%, 12%);
    --gao-surface-raised: hsl(215, 20%, 16%);
    --gao-surface-overlay: rgba(15, 19, 24, 0.85);
    --gao-border: hsl(215, 15%, 22%);
    --gao-border-light: hsl(215, 15%, 18%);
    --gao-text: hsl(215, 15%, 94%);
    --gao-text-secondary: hsl(215, 10%, 62%);
    --gao-text-muted: hsl(215, 10%, 46%);
    --gao-success-bg: hsl(152, 60%, 12%);
    --gao-warning-bg: hsl(38, 92%, 12%);
    --gao-danger-bg: hsl(350, 72%, 12%);
    --gao-info-bg: hsl(200, 80%, 12%);
    --gao-primary-bg: hsl(var(--gao-primary-h), var(--gao-primary-s), 14%);
    --gao-gray-50: hsl(215, 18%, 14%);
    --gao-gray-100: hsl(215, 18%, 18%);
    --gao-gray-200: hsl(215, 15%, 22%);
  }
}`;

// ─── Spacing Tokens ──────────────────────────────────────────

/**
 * Spacing scale from 1 (0.25rem) to 16 (4rem).
 * Follows a linear 0.25rem base increment.
 */
export const spacingTokensCSS: string = `
:root {
  /* ── Spacing Scale ── */
  --gao-space-0: 0;
  --gao-space-px: 1px;
  --gao-space-0-5: 0.125rem;
  --gao-space-1: 0.25rem;
  --gao-space-1-5: 0.375rem;
  --gao-space-2: 0.5rem;
  --gao-space-2-5: 0.625rem;
  --gao-space-3: 0.75rem;
  --gao-space-3-5: 0.875rem;
  --gao-space-4: 1rem;
  --gao-space-5: 1.25rem;
  --gao-space-6: 1.5rem;
  --gao-space-7: 1.75rem;
  --gao-space-8: 2rem;
  --gao-space-9: 2.25rem;
  --gao-space-10: 2.5rem;
  --gao-space-11: 2.75rem;
  --gao-space-12: 3rem;
  --gao-space-14: 3.5rem;
  --gao-space-16: 4rem;
  --gao-space-20: 5rem;
  --gao-space-24: 6rem;
}`;

// ─── Radius Tokens ───────────────────────────────────────────

/**
 * Border radius scale from none (0) to full (9999px).
 */
export const radiusTokensCSS: string = `
:root {
  /* ── Border Radius ── */
  --gao-radius-none: 0;
  --gao-radius-sm: 0.375rem;
  --gao-radius-md: 0.5rem;
  --gao-radius-lg: 0.75rem;
  --gao-radius-xl: 1rem;
  --gao-radius-2xl: 1.5rem;
  --gao-radius-full: 9999px;
}`;

// ─── Shadow Tokens ───────────────────────────────────────────

/**
 * Box shadow scale from xs to 2xl.
 */
export const shadowTokensCSS: string = `
:root {
  /* ── Shadows ── */
  --gao-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --gao-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --gao-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --gao-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --gao-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  --gao-shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  --gao-shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  --gao-shadow-none: 0 0 0 rgba(0, 0, 0, 0);
}`;

// ─── Z-Index Tokens ──────────────────────────────────────────

/**
 * Z-index scale for consistent layering.
 */
export const zIndexTokensCSS: string = `
:root {
  /* ── Z-Index Scale ── */
  --gao-z-hide: -1;
  --gao-z-base: 0;
  --gao-z-dropdown: 10;
  --gao-z-sticky: 20;
  --gao-z-fixed: 30;
  --gao-z-overlay: 40;
  --gao-z-modal: 50;
  --gao-z-popover: 60;
  --gao-z-toast: 70;
  --gao-z-tooltip: 80;
  --gao-z-max: 9999;
}`;

// ─── Transition Tokens ───────────────────────────────────────

/**
 * Transition presets for consistent animation timing.
 */
export const transitionTokensCSS: string = `
:root {
  /* ── Transitions ── */
  --gao-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --gao-transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --gao-transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  --gao-transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --gao-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --gao-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --gao-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Reduced Motion ── */
@media (prefers-reduced-motion: reduce) {
  :root {
    --gao-transition-fast: 0ms;
    --gao-transition-base: 0ms;
    --gao-transition-slow: 0ms;
    --gao-transition-spring: 0ms;
  }
}`;

// ─── Typography Tokens ───────────────────────────────────────

/**
 * Font family and sizing tokens.
 */
export const typographyTokensCSS: string = `
:root {
  /* ── Font Families ── */
  --gao-font-sans: 'GaoSans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --gao-font-mono: 'GaoMono', 'SF Mono', 'Cascadia Code', Consolas, monospace;
  --gao-font-display: 'GaoDisplay', var(--gao-font-sans);

  /* ── Font Sizes ── */
  --gao-text-xs: 0.75rem;
  --gao-text-sm: 0.875rem;
  --gao-text-base: 1rem;
  --gao-text-lg: 1.125rem;
  --gao-text-xl: 1.25rem;
  --gao-text-2xl: 1.5rem;
  --gao-text-3xl: 1.875rem;
  --gao-text-4xl: 2.25rem;
  --gao-text-5xl: 3rem;

  /* ── Line Heights ── */
  --gao-leading-none: 1;
  --gao-leading-tight: 1.25;
  --gao-leading-snug: 1.375;
  --gao-leading-normal: 1.5;
  --gao-leading-relaxed: 1.625;
  --gao-leading-loose: 2;

  /* ── Font Weights ── */
  --gao-font-light: 300;
  --gao-font-normal: 400;
  --gao-font-medium: 500;
  --gao-font-semibold: 600;
  --gao-font-bold: 700;
  --gao-font-extrabold: 800;

  /* ── Letter Spacing ── */
  --gao-tracking-tighter: -0.05em;
  --gao-tracking-tight: -0.025em;
  --gao-tracking-normal: 0;
  --gao-tracking-wide: 0.025em;
  --gao-tracking-wider: 0.05em;
  --gao-tracking-widest: 0.1em;
}`;

// ─── Combined Export ─────────────────────────────────────────

/**
 * All design tokens combined into a single CSS string.
 * Import this to get the complete token set.
 */
export const designTokensCSS: string = [
    colorTokensCSS,
    spacingTokensCSS,
    radiusTokensCSS,
    shadowTokensCSS,
    zIndexTokensCSS,
    transitionTokensCSS,
    typographyTokensCSS,
].join('\n');
