/**
 * @gao/ui — Modern CSS Reset
 *
 * Opinionated CSS reset for consistent cross-browser rendering.
 * Uses modern techniques (box-sizing, smooth scrolling, etc.)
 * with reduced-motion support.
 *
 * @since 0.6.0
 */

export const resetCSS: string = `
/* ═══════════════════════════════════════════════════════════
 * GAO CSS Reset v0.6.0
 * Modern, opinionated reset for cross-browser consistency.
 * ═══════════════════════════════════════════════════════════ */

/* ── Box Sizing ── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* ── Reset Margins & Padding ── */
* {
  margin: 0;
  padding: 0;
}

/* ── Document ── */
html {
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
  font-feature-settings: normal;
  font-variation-settings: normal;
  -webkit-tap-highlight-color: transparent;
}

html:focus-within {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html:focus-within {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ── Body ── */
body {
  min-height: 100vh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* ── Media Elements ── */
img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
  height: auto;
}

/* ── Form Elements ── */
input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;
  background: none;
  border: none;
}

/* ── Typography ── */
p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
}

h1, h2, h3, h4, h5, h6 {
  text-wrap: balance;
}

p {
  text-wrap: pretty;
}

/* ── Lists ── */
ul,
ol {
  list-style: none;
}

/* ── Links ── */
a {
  color: inherit;
  text-decoration: none;
}

/* ── Tables ── */
table {
  border-collapse: collapse;
  border-spacing: 0;
}

/* ── Misc ── */
hr {
  border: none;
  border-top: 1px solid var(--gao-border, hsl(215, 15%, 88%));
  height: 0;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--gao-gray-300, hsl(215, 12%, 78%));
  border-radius: var(--gao-radius-full, 9999px);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gao-gray-400, hsl(215, 10%, 62%));
}

/* ── Focus Visible ── */
:focus-visible {
  outline: 2px solid var(--gao-primary, hsl(215, 70%, 40%));
  outline-offset: 2px;
}

/* ── Selection ── */
::selection {
  background: var(--gao-primary-bg, hsl(215, 70%, 96%));
  color: var(--gao-primary-dark, hsl(215, 70%, 30%));
}
`;
