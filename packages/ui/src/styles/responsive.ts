/**
 * @gao/ui — Responsive System
 *
 * Breakpoints, container system, and responsive grid utilities.
 * All classes use the `.gao-` prefix.
 *
 * Breakpoints:
 *   sm: 640px   — Mobile landscape
 *   md: 768px   — Tablets
 *   lg: 1024px  — Laptops
 *   xl: 1280px  — Desktops
 *   2xl: 1536px — Large screens
 *
 * @since 0.6.0
 */

export const responsiveCSS: string = `
/* ═══════════════════════════════════════════════════════════
 * GAO Responsive System v0.6.0
 * Containers, responsive grids, and breakpoint utilities
 * ═══════════════════════════════════════════════════════════ */

/* ── Container ── */
.gao-container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--gao-space-4);
  padding-right: var(--gao-space-4);
}

.gao-container-sm { max-width: 640px; }
.gao-container-md { max-width: 768px; }
.gao-container-lg { max-width: 1024px; }
.gao-container-xl { max-width: 1280px; }
.gao-container-full { max-width: 100%; }

@media (min-width: 640px) {
  .gao-container { max-width: 640px; padding-left: var(--gao-space-6); padding-right: var(--gao-space-6); }
}

@media (min-width: 768px) {
  .gao-container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .gao-container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .gao-container { max-width: 1280px; }
}

@media (min-width: 1536px) {
  .gao-container { max-width: 1536px; }
}

/* ── Responsive Grid ── */
.gao-grid-1 { display: grid; grid-template-columns: 1fr; gap: var(--gao-space-6); }
.gao-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--gao-space-6); }
.gao-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gao-space-6); }
.gao-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--gao-space-6); }
.gao-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--gao-space-6); }
.gao-grid-6 { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--gao-space-6); }

/* Auto-responsive grid — min 280px columns */
.gao-grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--gao-space-6);
}

.gao-grid-auto-sm {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--gao-space-4);
}

.gao-grid-auto-lg {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--gao-space-6);
}

/* ── Responsive Grid Collapse ── */
@media (max-width: 1024px) {
  .gao-grid-4 { grid-template-columns: repeat(2, 1fr); }
  .gao-grid-5 { grid-template-columns: repeat(2, 1fr); }
  .gao-grid-6 { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .gao-grid-2 { grid-template-columns: 1fr; }
  .gao-grid-3 { grid-template-columns: 1fr; }
  .gao-grid-4 { grid-template-columns: 1fr; }
  .gao-grid-5 { grid-template-columns: 1fr; }
  .gao-grid-6 { grid-template-columns: 1fr; }
}

/* ── Responsive Visibility ── */
.gao-hide-mobile { display: block; }
.gao-hide-desktop { display: none; }
.gao-show-mobile { display: none; }
.gao-show-desktop { display: block; }

@media (max-width: 768px) {
  .gao-hide-mobile { display: none; }
  .gao-show-mobile { display: block; }
  .gao-hide-desktop { display: block; }
  .gao-show-desktop { display: none; }
}

/* ── Responsive Spacing ── */
@media (max-width: 768px) {
  .gao-sm\\:p-3 { padding: var(--gao-space-3); }
  .gao-sm\\:p-4 { padding: var(--gao-space-4); }
  .gao-sm\\:gap-3 { gap: var(--gao-space-3); }
  .gao-sm\\:gap-4 { gap: var(--gao-space-4); }
  .gao-sm\\:text-center { text-align: center; }
  .gao-sm\\:flex-col { flex-direction: column; }
}
`;
