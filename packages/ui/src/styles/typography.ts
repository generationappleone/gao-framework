/**
 * @gao/ui — Typography System
 *
 * Fluid typography using clamp() for responsive type scale.
 * All classes use the `.gao-` prefix.
 *
 * @since 0.6.0
 */

export const typographyCSS: string = `
/* ═══════════════════════════════════════════════════════════
 * GAO Typography System v0.6.0
 * Fluid responsive type scale with clamp()
 * ═══════════════════════════════════════════════════════════ */

/* ── Headings ── */
.gao-h1 {
  font-size: clamp(2rem, 1.5rem + 2.5vw, 3rem);
  font-weight: var(--gao-font-bold, 700);
  line-height: var(--gao-leading-tight, 1.25);
  letter-spacing: var(--gao-tracking-tight, -0.025em);
  font-family: var(--gao-font-display, system-ui);
  color: var(--gao-text);
}

.gao-h2 {
  font-size: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem);
  font-weight: var(--gao-font-semibold, 600);
  line-height: var(--gao-leading-tight, 1.25);
  letter-spacing: var(--gao-tracking-tight, -0.025em);
  color: var(--gao-text);
}

.gao-h3 {
  font-size: clamp(1.25rem, 1.1rem + 0.75vw, 1.875rem);
  font-weight: var(--gao-font-semibold, 600);
  line-height: var(--gao-leading-snug, 1.375);
  color: var(--gao-text);
}

.gao-h4 {
  font-size: clamp(1.125rem, 1rem + 0.5vw, 1.5rem);
  font-weight: var(--gao-font-semibold, 600);
  line-height: var(--gao-leading-snug, 1.375);
  color: var(--gao-text);
}

.gao-h5 {
  font-size: clamp(1rem, 0.95rem + 0.25vw, 1.25rem);
  font-weight: var(--gao-font-semibold, 600);
  line-height: var(--gao-leading-normal, 1.5);
  color: var(--gao-text);
}

.gao-h6 {
  font-size: clamp(0.875rem, 0.85rem + 0.15vw, 1.125rem);
  font-weight: var(--gao-font-semibold, 600);
  line-height: var(--gao-leading-normal, 1.5);
  color: var(--gao-text);
}

/* ── Body Text ── */
.gao-body {
  font-size: var(--gao-text-base, 1rem);
  font-weight: var(--gao-font-normal, 400);
  line-height: var(--gao-leading-normal, 1.5);
  color: var(--gao-text);
}

.gao-lead {
  font-size: var(--gao-text-lg, 1.125rem);
  font-weight: var(--gao-font-normal, 400);
  line-height: var(--gao-leading-relaxed, 1.625);
  color: var(--gao-text-secondary);
}

.gao-small {
  font-size: var(--gao-text-sm, 0.875rem);
  line-height: var(--gao-leading-normal, 1.5);
  color: var(--gao-text-secondary);
}

.gao-caption {
  font-size: var(--gao-text-xs, 0.75rem);
  line-height: var(--gao-leading-normal, 1.5);
  color: var(--gao-text-muted);
}

.gao-overline {
  font-size: var(--gao-text-xs, 0.75rem);
  font-weight: var(--gao-font-semibold, 600);
  text-transform: uppercase;
  letter-spacing: var(--gao-tracking-widest, 0.1em);
  color: var(--gao-text-muted);
}

/* ── Links ── */
.gao-link {
  color: var(--gao-primary);
  text-decoration: none;
  transition: color var(--gao-transition-fast, 150ms ease);
  cursor: pointer;
}

.gao-link:hover {
  color: var(--gao-primary-dark);
  text-decoration: underline;
}

/* ── Code ── */
.gao-code {
  font-family: var(--gao-font-mono, monospace);
  font-size: 0.875em;
  padding: 0.125em 0.375em;
  background: var(--gao-gray-100);
  border-radius: var(--gao-radius-sm, 0.375rem);
  color: var(--gao-danger);
}

.gao-pre {
  font-family: var(--gao-font-mono, monospace);
  font-size: var(--gao-text-sm, 0.875rem);
  padding: var(--gao-space-4, 1rem);
  background: var(--gao-gray-50);
  border: 1px solid var(--gao-border);
  border-radius: var(--gao-radius-lg, 0.75rem);
  overflow-x: auto;
  line-height: var(--gao-leading-relaxed, 1.625);
}

/* ── Blockquote ── */
.gao-blockquote {
  padding-left: var(--gao-space-4, 1rem);
  border-left: 4px solid var(--gao-primary);
  font-style: italic;
  color: var(--gao-text-secondary);
}

/* ── Truncation ── */
.gao-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gao-line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.gao-line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
`;
