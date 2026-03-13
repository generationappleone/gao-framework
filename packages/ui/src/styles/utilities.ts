/**
 * @gao/ui — Utility Classes
 *
 * General-purpose CSS utility classes for spacing, display, flex, text,
 * and color. All classes prefixed with `.gao-`.
 *
 * @since 0.6.0
 */

export const utilitiesCSS: string = `
/* ═══════════════════════════════════════════════════════════
 * GAO Utility Classes v0.6.0
 * Spacing, display, flex, text, and color utilities
 * ═══════════════════════════════════════════════════════════ */

/* ── Display ── */
.gao-block { display: block; }
.gao-inline-block { display: inline-block; }
.gao-inline { display: inline; }
.gao-flex { display: flex; }
.gao-inline-flex { display: inline-flex; }
.gao-grid { display: grid; }
.gao-hidden { display: none; }

/* ── Flex Utilities ── */
.gao-flex-row { flex-direction: row; }
.gao-flex-col { flex-direction: column; }
.gao-flex-wrap { flex-wrap: wrap; }
.gao-flex-nowrap { flex-wrap: nowrap; }
.gao-flex-1 { flex: 1 1 0%; }
.gao-flex-auto { flex: 1 1 auto; }
.gao-flex-none { flex: none; }
.gao-flex-center { display: flex; align-items: center; justify-content: center; }
.gao-flex-between { display: flex; align-items: center; justify-content: space-between; }
.gao-flex-start { display: flex; align-items: center; justify-content: flex-start; }
.gao-flex-end { display: flex; align-items: center; justify-content: flex-end; }

/* ── Align & Justify ── */
.gao-items-start { align-items: flex-start; }
.gao-items-center { align-items: center; }
.gao-items-end { align-items: flex-end; }
.gao-items-stretch { align-items: stretch; }
.gao-justify-start { justify-content: flex-start; }
.gao-justify-center { justify-content: center; }
.gao-justify-end { justify-content: flex-end; }
.gao-justify-between { justify-content: space-between; }
.gao-justify-around { justify-content: space-around; }

/* ── Gap ── */
.gao-gap-1 { gap: var(--gao-space-1); }
.gao-gap-2 { gap: var(--gao-space-2); }
.gao-gap-3 { gap: var(--gao-space-3); }
.gao-gap-4 { gap: var(--gao-space-4); }
.gao-gap-5 { gap: var(--gao-space-5); }
.gao-gap-6 { gap: var(--gao-space-6); }
.gao-gap-8 { gap: var(--gao-space-8); }

/* ── Margin ── */
.gao-m-0 { margin: 0; }
.gao-m-1 { margin: var(--gao-space-1); }
.gao-m-2 { margin: var(--gao-space-2); }
.gao-m-3 { margin: var(--gao-space-3); }
.gao-m-4 { margin: var(--gao-space-4); }
.gao-m-5 { margin: var(--gao-space-5); }
.gao-m-6 { margin: var(--gao-space-6); }
.gao-m-auto { margin: auto; }

.gao-mt-0 { margin-top: 0; }
.gao-mt-1 { margin-top: var(--gao-space-1); }
.gao-mt-2 { margin-top: var(--gao-space-2); }
.gao-mt-3 { margin-top: var(--gao-space-3); }
.gao-mt-4 { margin-top: var(--gao-space-4); }
.gao-mt-5 { margin-top: var(--gao-space-5); }
.gao-mt-6 { margin-top: var(--gao-space-6); }
.gao-mt-8 { margin-top: var(--gao-space-8); }

.gao-mb-0 { margin-bottom: 0; }
.gao-mb-1 { margin-bottom: var(--gao-space-1); }
.gao-mb-2 { margin-bottom: var(--gao-space-2); }
.gao-mb-3 { margin-bottom: var(--gao-space-3); }
.gao-mb-4 { margin-bottom: var(--gao-space-4); }
.gao-mb-5 { margin-bottom: var(--gao-space-5); }
.gao-mb-6 { margin-bottom: var(--gao-space-6); }
.gao-mb-8 { margin-bottom: var(--gao-space-8); }

.gao-ml-0 { margin-left: 0; }
.gao-ml-1 { margin-left: var(--gao-space-1); }
.gao-ml-2 { margin-left: var(--gao-space-2); }
.gao-ml-3 { margin-left: var(--gao-space-3); }
.gao-ml-4 { margin-left: var(--gao-space-4); }
.gao-ml-auto { margin-left: auto; }

.gao-mr-0 { margin-right: 0; }
.gao-mr-1 { margin-right: var(--gao-space-1); }
.gao-mr-2 { margin-right: var(--gao-space-2); }
.gao-mr-3 { margin-right: var(--gao-space-3); }
.gao-mr-4 { margin-right: var(--gao-space-4); }
.gao-mr-auto { margin-right: auto; }

.gao-mx-auto { margin-left: auto; margin-right: auto; }

/* ── Padding ── */
.gao-p-0 { padding: 0; }
.gao-p-1 { padding: var(--gao-space-1); }
.gao-p-2 { padding: var(--gao-space-2); }
.gao-p-3 { padding: var(--gao-space-3); }
.gao-p-4 { padding: var(--gao-space-4); }
.gao-p-5 { padding: var(--gao-space-5); }
.gao-p-6 { padding: var(--gao-space-6); }
.gao-p-8 { padding: var(--gao-space-8); }

.gao-px-2 { padding-left: var(--gao-space-2); padding-right: var(--gao-space-2); }
.gao-px-3 { padding-left: var(--gao-space-3); padding-right: var(--gao-space-3); }
.gao-px-4 { padding-left: var(--gao-space-4); padding-right: var(--gao-space-4); }
.gao-px-6 { padding-left: var(--gao-space-6); padding-right: var(--gao-space-6); }
.gao-px-8 { padding-left: var(--gao-space-8); padding-right: var(--gao-space-8); }

.gao-py-2 { padding-top: var(--gao-space-2); padding-bottom: var(--gao-space-2); }
.gao-py-3 { padding-top: var(--gao-space-3); padding-bottom: var(--gao-space-3); }
.gao-py-4 { padding-top: var(--gao-space-4); padding-bottom: var(--gao-space-4); }
.gao-py-6 { padding-top: var(--gao-space-6); padding-bottom: var(--gao-space-6); }
.gao-py-8 { padding-top: var(--gao-space-8); padding-bottom: var(--gao-space-8); }

/* ── Text Alignment ── */
.gao-text-left { text-align: left; }
.gao-text-center { text-align: center; }
.gao-text-right { text-align: right; }

/* ── Text Colors ── */
.gao-text-primary { color: var(--gao-primary); }
.gao-text-secondary { color: var(--gao-text-secondary); }
.gao-text-muted { color: var(--gao-text-muted); }
.gao-text-success { color: var(--gao-success); }
.gao-text-warning { color: var(--gao-warning); }
.gao-text-danger { color: var(--gao-danger); }
.gao-text-info { color: var(--gao-info); }
.gao-text-inverse { color: var(--gao-text-inverse); }

/* ── Background Colors ── */
.gao-bg-primary { background-color: var(--gao-primary); color: var(--gao-text-inverse); }
.gao-bg-primary-light { background-color: var(--gao-primary-bg); color: var(--gao-primary); }
.gao-bg-surface { background-color: var(--gao-surface); }
.gao-bg-success { background-color: var(--gao-success-bg); color: var(--gao-success); }
.gao-bg-warning { background-color: var(--gao-warning-bg); color: var(--gao-warning); }
.gao-bg-danger { background-color: var(--gao-danger-bg); color: var(--gao-danger); }
.gao-bg-info { background-color: var(--gao-info-bg); color: var(--gao-info); }

/* ── Border ── */
.gao-border { border: 1px solid var(--gao-border); }
.gao-border-light { border: 1px solid var(--gao-border-light); }
.gao-border-top { border-top: 1px solid var(--gao-border); }
.gao-border-bottom { border-bottom: 1px solid var(--gao-border); }
.gao-border-none { border: none; }

/* ── Border Radius ── */
.gao-rounded-none { border-radius: var(--gao-radius-none); }
.gao-rounded-sm { border-radius: var(--gao-radius-sm); }
.gao-rounded { border-radius: var(--gao-radius-md); }
.gao-rounded-lg { border-radius: var(--gao-radius-lg); }
.gao-rounded-xl { border-radius: var(--gao-radius-xl); }
.gao-rounded-2xl { border-radius: var(--gao-radius-2xl); }
.gao-rounded-full { border-radius: var(--gao-radius-full); }

/* ── Shadow ── */
.gao-shadow-none { box-shadow: var(--gao-shadow-none); }
.gao-shadow-sm { box-shadow: var(--gao-shadow-sm); }
.gao-shadow { box-shadow: var(--gao-shadow-md); }
.gao-shadow-lg { box-shadow: var(--gao-shadow-lg); }
.gao-shadow-xl { box-shadow: var(--gao-shadow-xl); }

/* ── Width & Height ── */
.gao-w-full { width: 100%; }
.gao-w-auto { width: auto; }
.gao-h-full { height: 100%; }
.gao-h-screen { height: 100vh; }
.gao-min-h-screen { min-height: 100vh; }

/* ── Overflow ── */
.gao-overflow-hidden { overflow: hidden; }
.gao-overflow-auto { overflow: auto; }
.gao-overflow-x-auto { overflow-x: auto; }

/* ── Position ── */
.gao-relative { position: relative; }
.gao-absolute { position: absolute; }
.gao-fixed { position: fixed; }
.gao-sticky { position: sticky; }

/* ── Cursor ── */
.gao-cursor-pointer { cursor: pointer; }
.gao-cursor-default { cursor: default; }
.gao-cursor-not-allowed { cursor: not-allowed; }

/* ── Opacity ── */
.gao-opacity-0 { opacity: 0; }
.gao-opacity-50 { opacity: 0.5; }
.gao-opacity-75 { opacity: 0.75; }
.gao-opacity-100 { opacity: 1; }

/* ── Transitions ── */
.gao-transition { transition: all var(--gao-transition-base); }
.gao-transition-fast { transition: all var(--gao-transition-fast); }
.gao-transition-slow { transition: all var(--gao-transition-slow); }
.gao-transition-none { transition: none; }

/* ── Screen Reader Only ── */
.gao-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
`;
