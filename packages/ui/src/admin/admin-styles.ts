/**
 * @gao/ui — Admin CSS Design System
 *
 * Complete CSS design system for GaoAdmin template (~1500 lines).
 * Features: HSL color tokens, dark/light mode, glassmorphism,
 * typography scale, responsive grid, animations.
 *
 * All CSS uses `.gao-admin-*` prefix to prevent leaks.
 * Zero external dependencies — pure CSS custom properties.
 */

// ─── Color Tokens ────────────────────────────────────────────

const COLOR_SYSTEM = `
/* ═══════════════════════════════════════════════════════════
 * GaoAdmin — Design System v0.5.0
 * HSL Semantic Color Tokens + Dark/Light Mode
 * ═══════════════════════════════════════════════════════════ */

:root {
  /* ── Primary Palette ── */
  --gao-primary-h: 230;
  --gao-primary-s: 80%;
  --gao-primary-l: 56%;
  --gao-primary: hsl(var(--gao-primary-h), var(--gao-primary-s), var(--gao-primary-l));
  --gao-primary-light: hsl(var(--gao-primary-h), var(--gao-primary-s), 70%);
  --gao-primary-dark: hsl(var(--gao-primary-h), var(--gao-primary-s), 44%);
  --gao-primary-bg: hsl(var(--gao-primary-h), var(--gao-primary-s), 96%);

  /* ── Accent ── */
  --gao-accent-h: 270;
  --gao-accent-s: 70%;
  --gao-accent-l: 60%;
  --gao-accent: hsl(var(--gao-accent-h), var(--gao-accent-s), var(--gao-accent-l));

  /* ── Semantic Colors ── */
  --gao-success: hsl(152, 60%, 42%);
  --gao-success-bg: hsl(152, 60%, 95%);
  --gao-warning: hsl(38, 92%, 50%);
  --gao-warning-bg: hsl(38, 92%, 95%);
  --gao-danger: hsl(350, 72%, 52%);
  --gao-danger-bg: hsl(350, 72%, 96%);
  --gao-info: hsl(200, 80%, 50%);
  --gao-info-bg: hsl(200, 80%, 96%);

  /* ── Neutral Scale ── */
  --gao-gray-50: hsl(220, 14%, 97%);
  --gao-gray-100: hsl(220, 14%, 94%);
  --gao-gray-200: hsl(220, 13%, 88%);
  --gao-gray-300: hsl(218, 12%, 78%);
  --gao-gray-400: hsl(218, 10%, 62%);
  --gao-gray-500: hsl(218, 10%, 46%);
  --gao-gray-600: hsl(218, 12%, 34%);
  --gao-gray-700: hsl(218, 14%, 24%);
  --gao-gray-800: hsl(218, 18%, 16%);
  --gao-gray-900: hsl(218, 22%, 10%);
  --gao-gray-950: hsl(218, 28%, 6%);

  /* ── Surface (Light Mode) ── */
  --gao-bg: hsl(220, 14%, 97%);
  --gao-surface: #ffffff;
  --gao-surface-raised: #ffffff;
  --gao-surface-overlay: rgba(255, 255, 255, 0.8);
  --gao-border: hsl(220, 13%, 88%);
  --gao-border-light: hsl(220, 14%, 94%);

  /* ── Text ── */
  --gao-text: hsl(218, 22%, 10%);
  --gao-text-secondary: hsl(218, 10%, 46%);
  --gao-text-muted: hsl(218, 10%, 62%);
  --gao-text-inverse: #ffffff;

  /* ── Shadows ── */
  --gao-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --gao-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --gao-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --gao-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --gao-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);

  /* ── Spacing Scale ── */
  --gao-space-1: 0.25rem;
  --gao-space-2: 0.5rem;
  --gao-space-3: 0.75rem;
  --gao-space-4: 1rem;
  --gao-space-5: 1.25rem;
  --gao-space-6: 1.5rem;
  --gao-space-8: 2rem;
  --gao-space-10: 2.5rem;
  --gao-space-12: 3rem;
  --gao-space-16: 4rem;

  /* ── Border Radius ── */
  --gao-radius-sm: 0.375rem;
  --gao-radius-md: 0.5rem;
  --gao-radius-lg: 0.75rem;
  --gao-radius-xl: 1rem;
  --gao-radius-2xl: 1.5rem;
  --gao-radius-full: 9999px;

  /* ── Transitions ── */
  --gao-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --gao-transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --gao-transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

  /* ── Typography ── */
  --gao-font-sans: 'GaoSans', system-ui, -apple-system, sans-serif;
  --gao-font-mono: 'GaoMono', 'SF Mono', Consolas, monospace;
  --gao-font-display: 'GaoDisplay', var(--gao-font-sans);

  /* ── Glassmorphism ── */
  --gao-glass-bg: rgba(255, 255, 255, 0.7);
  --gao-glass-border: rgba(255, 255, 255, 0.3);
  --gao-glass-backdrop: blur(16px) saturate(180%);

  /* ── Sidebar ── */
  --gao-sidebar-width: 260px;
  --gao-sidebar-collapsed-width: 72px;
  --gao-navbar-height: 64px;
}`;

// ─── Dark Mode ───────────────────────────────────────────────

const DARK_MODE = `
/* ── Dark Mode ── */
[data-theme="dark"],
.gao-admin-dark {
  --gao-bg: hsl(218, 22%, 8%);
  --gao-surface: hsl(218, 18%, 12%);
  --gao-surface-raised: hsl(218, 18%, 16%);
  --gao-surface-overlay: rgba(20, 22, 30, 0.85);
  --gao-border: hsl(218, 14%, 22%);
  --gao-border-light: hsl(218, 14%, 18%);

  --gao-text: hsl(220, 14%, 94%);
  --gao-text-secondary: hsl(218, 10%, 62%);
  --gao-text-muted: hsl(218, 10%, 46%);

  --gao-success-bg: hsl(152, 60%, 12%);
  --gao-warning-bg: hsl(38, 92%, 12%);
  --gao-danger-bg: hsl(350, 72%, 12%);
  --gao-info-bg: hsl(200, 80%, 12%);
  --gao-primary-bg: hsl(var(--gao-primary-h), var(--gao-primary-s), 14%);

  --gao-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --gao-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --gao-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --gao-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);

  --gao-glass-bg: rgba(20, 22, 30, 0.75);
  --gao-glass-border: rgba(255, 255, 255, 0.08);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --gao-bg: hsl(218, 22%, 8%);
    --gao-surface: hsl(218, 18%, 12%);
    --gao-surface-raised: hsl(218, 18%, 16%);
    --gao-surface-overlay: rgba(20, 22, 30, 0.85);
    --gao-border: hsl(218, 14%, 22%);
    --gao-border-light: hsl(218, 14%, 18%);
    --gao-text: hsl(220, 14%, 94%);
    --gao-text-secondary: hsl(218, 10%, 62%);
    --gao-text-muted: hsl(218, 10%, 46%);
    --gao-success-bg: hsl(152, 60%, 12%);
    --gao-warning-bg: hsl(38, 92%, 12%);
    --gao-danger-bg: hsl(350, 72%, 12%);
    --gao-info-bg: hsl(200, 80%, 12%);
    --gao-primary-bg: hsl(var(--gao-primary-h), var(--gao-primary-s), 14%);
    --gao-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
    --gao-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --gao-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
    --gao-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
    --gao-glass-bg: rgba(20, 22, 30, 0.75);
    --gao-glass-border: rgba(255, 255, 255, 0.08);
  }
}`;

// ─── Reset & Typography ──────────────────────────────────────

const RESET_AND_TYPOGRAPHY = `
/* ── Reset ── */
.gao-admin-wrapper *,
.gao-admin-wrapper *::before,
.gao-admin-wrapper *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.gao-admin-wrapper {
  font-family: var(--gao-font-sans);
  font-size: 14px;
  line-height: 1.5;
  color: var(--gao-text);
  background: var(--gao-bg);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Typography Scale ── */
.gao-admin-h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em; font-family: var(--gao-font-display); }
.gao-admin-h2 { font-size: 1.5rem; font-weight: 600; line-height: 1.25; letter-spacing: -0.015em; }
.gao-admin-h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; }
.gao-admin-h4 { font-size: 1.1rem; font-weight: 600; line-height: 1.35; }
.gao-admin-body { font-size: 0.875rem; line-height: 1.5; }
.gao-admin-small { font-size: 0.75rem; line-height: 1.4; color: var(--gao-text-secondary); }
.gao-admin-code { font-family: var(--gao-font-mono); font-size: 0.8125rem; padding: 0.125em 0.375em; background: var(--gao-gray-100); border-radius: var(--gao-radius-sm); }

/* ── Links ── */
.gao-admin-wrapper a { color: var(--gao-primary); text-decoration: none; transition: color var(--gao-transition-fast); }
.gao-admin-wrapper a:hover { color: var(--gao-primary-dark); }`;

// ─── Layout ──────────────────────────────────────────────────

const LAYOUT = `
/* ── Layout ── */
.gao-admin-layout {
  display: grid;
  grid-template-columns: var(--gao-sidebar-width) 1fr;
  grid-template-rows: var(--gao-navbar-height) 1fr;
  grid-template-areas:
    "sidebar navbar"
    "sidebar content";
  min-height: 100vh;
  transition: grid-template-columns var(--gao-transition-base);
}

.gao-admin-layout.gao-admin-collapsed {
  grid-template-columns: var(--gao-sidebar-collapsed-width) 1fr;
}

/* ── Sidebar ── */
.gao-admin-sidebar {
  grid-area: sidebar;
  background: var(--gao-glass-bg);
  backdrop-filter: var(--gao-glass-backdrop);
  -webkit-backdrop-filter: var(--gao-glass-backdrop);
  border-right: 1px solid var(--gao-glass-border);
  padding: var(--gao-space-4) 0;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 50;
  transition: all var(--gao-transition-base);
}

.gao-admin-sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--gao-space-3);
  padding: var(--gao-space-2) var(--gao-space-6);
  margin-bottom: var(--gao-space-6);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gao-text);
  white-space: nowrap;
}

.gao-admin-sidebar-brand svg { flex-shrink: 0; }

.gao-admin-sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: var(--gao-space-1); padding: 0 var(--gao-space-3); }

.gao-admin-sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--gao-space-3);
  padding: var(--gao-space-3) var(--gao-space-3);
  border-radius: var(--gao-radius-md);
  color: var(--gao-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--gao-transition-fast);
  white-space: nowrap;
  text-decoration: none;
}

.gao-admin-sidebar-item:hover {
  background: var(--gao-primary-bg);
  color: var(--gao-primary);
}

.gao-admin-sidebar-item.active {
  background: var(--gao-primary-bg);
  color: var(--gao-primary);
  font-weight: 600;
}

.gao-admin-sidebar-item svg { flex-shrink: 0; opacity: 0.7; }
.gao-admin-sidebar-item:hover svg,
.gao-admin-sidebar-item.active svg { opacity: 1; }

.gao-admin-sidebar-section {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gao-text-muted);
  padding: var(--gao-space-4) var(--gao-space-3) var(--gao-space-2);
}

.gao-admin-sidebar-footer {
  padding: var(--gao-space-4) var(--gao-space-4);
  border-top: 1px solid var(--gao-border-light);
  margin-top: auto;
}

/* ── Navbar ── */
.gao-admin-navbar {
  grid-area: navbar;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--gao-space-6);
  background: var(--gao-surface);
  border-bottom: 1px solid var(--gao-border-light);
  position: sticky;
  top: 0;
  z-index: 40;
  height: var(--gao-navbar-height);
}

.gao-admin-navbar-left { display: flex; align-items: center; gap: var(--gao-space-4); }
.gao-admin-navbar-right { display: flex; align-items: center; gap: var(--gao-space-3); }

.gao-admin-navbar-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--gao-text-secondary);
  cursor: pointer;
  padding: var(--gao-space-2);
  border-radius: var(--gao-radius-md);
  transition: background var(--gao-transition-fast);
}

.gao-admin-navbar-toggle:hover { background: var(--gao-gray-100); }

.gao-admin-search {
  display: flex;
  align-items: center;
  gap: var(--gao-space-2);
  padding: var(--gao-space-2) var(--gao-space-4);
  background: var(--gao-gray-50);
  border: 1px solid var(--gao-border);
  border-radius: var(--gao-radius-full);
  width: 280px;
  transition: all var(--gao-transition-fast);
}

.gao-admin-search:focus-within {
  border-color: var(--gao-primary);
  box-shadow: 0 0 0 3px var(--gao-primary-bg);
}

.gao-admin-search input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--gao-text);
  width: 100%;
}

.gao-admin-search input::placeholder { color: var(--gao-text-muted); }

/* ── Content ── */
.gao-admin-content {
  grid-area: content;
  padding: var(--gao-space-6);
  overflow-y: auto;
}

.gao-admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--gao-space-6);
}

.gao-admin-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--gao-space-2);
  font-size: 0.8125rem;
  color: var(--gao-text-muted);
  margin-bottom: var(--gao-space-2);
}

.gao-admin-breadcrumb a { color: var(--gao-text-secondary); }
.gao-admin-breadcrumb a:hover { color: var(--gao-primary); }
.gao-admin-breadcrumb-separator { color: var(--gao-text-muted); }`;

// ─── Components ──────────────────────────────────────────────

const COMPONENTS = `
/* ── Card ── */
.gao-admin-card {
  background: var(--gao-surface);
  border: 1px solid var(--gao-border-light);
  border-radius: var(--gao-radius-lg);
  padding: var(--gao-space-6);
  box-shadow: var(--gao-shadow-sm);
  transition: box-shadow var(--gao-transition-fast);
}

.gao-admin-card:hover { box-shadow: var(--gao-shadow-md); }

.gao-admin-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--gao-space-4);
}

.gao-admin-card-title { font-size: 1rem; font-weight: 600; color: var(--gao-text); }

/* ── Stat Card ── */
.gao-admin-stat-card {
  background: var(--gao-surface);
  border: 1px solid var(--gao-border-light);
  border-radius: var(--gao-radius-lg);
  padding: var(--gao-space-5);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  box-shadow: var(--gao-shadow-sm);
  transition: all var(--gao-transition-fast);
}

.gao-admin-stat-card:hover {
  box-shadow: var(--gao-shadow-md);
  transform: translateY(-2px);
}

.gao-admin-stat-value { font-size: 1.75rem; font-weight: 700; line-height: 1; color: var(--gao-text); }
.gao-admin-stat-label { font-size: 0.8125rem; color: var(--gao-text-secondary); margin-top: var(--gao-space-1); }
.gao-admin-stat-trend { font-size: 0.75rem; font-weight: 600; margin-top: var(--gao-space-2); display: flex; align-items: center; gap: var(--gao-space-1); }
.gao-admin-stat-trend.up { color: var(--gao-success); }
.gao-admin-stat-trend.down { color: var(--gao-danger); }
.gao-admin-stat-icon {
  width: 48px; height: 48px; border-radius: var(--gao-radius-lg);
  display: flex; align-items: center; justify-content: center;
  background: var(--gao-primary-bg); color: var(--gao-primary);
}

/* ── Button ── */
.gao-admin-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--gao-space-2);
  padding: var(--gao-space-2) var(--gao-space-4);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  border-radius: var(--gao-radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--gao-transition-fast);
  white-space: nowrap;
  line-height: 1.5;
}

.gao-admin-btn-primary { background: var(--gao-primary); color: #fff; }
.gao-admin-btn-primary:hover { background: var(--gao-primary-dark); }
.gao-admin-btn-secondary { background: var(--gao-gray-100); color: var(--gao-text); border-color: var(--gao-border); }
.gao-admin-btn-secondary:hover { background: var(--gao-gray-200); }
.gao-admin-btn-danger { background: var(--gao-danger); color: #fff; }
.gao-admin-btn-danger:hover { background: hsl(350, 72%, 44%); }
.gao-admin-btn-ghost { background: transparent; color: var(--gao-text-secondary); }
.gao-admin-btn-ghost:hover { background: var(--gao-gray-100); color: var(--gao-text); }
.gao-admin-btn-sm { padding: var(--gao-space-1) var(--gao-space-3); font-size: 0.8125rem; }
.gao-admin-btn-lg { padding: var(--gao-space-3) var(--gao-space-6); font-size: 1rem; }
.gao-admin-btn-icon { padding: var(--gao-space-2); }

/* ── Table ── */
.gao-admin-table-wrapper {
  background: var(--gao-surface);
  border: 1px solid var(--gao-border-light);
  border-radius: var(--gao-radius-lg);
  overflow: hidden;
  box-shadow: var(--gao-shadow-sm);
}

.gao-admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.gao-admin-table th {
  padding: var(--gao-space-3) var(--gao-space-4);
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gao-text-secondary);
  background: var(--gao-gray-50);
  border-bottom: 1px solid var(--gao-border);
}

.gao-admin-table td {
  padding: var(--gao-space-3) var(--gao-space-4);
  border-bottom: 1px solid var(--gao-border-light);
  color: var(--gao-text);
  vertical-align: middle;
}

.gao-admin-table tr:last-child td { border-bottom: none; }
.gao-admin-table tr:hover td { background: var(--gao-gray-50); }

.gao-admin-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gao-space-3) var(--gao-space-4);
  border-top: 1px solid var(--gao-border-light);
  font-size: 0.8125rem;
  color: var(--gao-text-secondary);
}

/* ── Badge ── */
.gao-admin-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--gao-space-1);
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: var(--gao-radius-full);
  line-height: 1.5;
}

.gao-admin-badge-primary { background: var(--gao-primary-bg); color: var(--gao-primary); }
.gao-admin-badge-success { background: var(--gao-success-bg); color: var(--gao-success); }
.gao-admin-badge-warning { background: var(--gao-warning-bg); color: var(--gao-warning); }
.gao-admin-badge-danger { background: var(--gao-danger-bg); color: var(--gao-danger); }
.gao-admin-badge-info { background: var(--gao-info-bg); color: var(--gao-info); }

.gao-admin-badge-dot::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ── Form ── */
.gao-admin-form-group { margin-bottom: var(--gao-space-4); }
.gao-admin-label { display: block; font-size: 0.8125rem; font-weight: 500; color: var(--gao-text); margin-bottom: var(--gao-space-1); }
.gao-admin-input {
  width: 100%; padding: var(--gao-space-2) var(--gao-space-3);
  font-size: 0.875rem; font-family: inherit;
  border: 1px solid var(--gao-border); border-radius: var(--gao-radius-md);
  background: var(--gao-surface); color: var(--gao-text);
  transition: all var(--gao-transition-fast);
}
.gao-admin-input:focus { outline: none; border-color: var(--gao-primary); box-shadow: 0 0 0 3px var(--gao-primary-bg); }
.gao-admin-input::placeholder { color: var(--gao-text-muted); }
.gao-admin-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; padding-right: 2.5rem; }

/* ── Toast ── */
.gao-admin-toast-container { position: fixed; top: var(--gao-space-4); right: var(--gao-space-4); z-index: 1000; display: flex; flex-direction: column; gap: var(--gao-space-3); }
.gao-admin-toast {
  display: flex; align-items: flex-start; gap: var(--gao-space-3);
  padding: var(--gao-space-4); min-width: 320px;
  background: var(--gao-surface); border-radius: var(--gao-radius-lg);
  box-shadow: var(--gao-shadow-xl); border: 1px solid var(--gao-border-light);
  animation: gao-admin-slide-in 0.3s ease-out;
}
.gao-admin-toast-success { border-left: 4px solid var(--gao-success); }
.gao-admin-toast-error { border-left: 4px solid var(--gao-danger); }
.gao-admin-toast-warning { border-left: 4px solid var(--gao-warning); }
.gao-admin-toast-info { border-left: 4px solid var(--gao-info); }
.gao-admin-toast-close { background: none; border: none; color: var(--gao-text-muted); cursor: pointer; padding: var(--gao-space-1); margin-left: auto; }

/* ── Modal ── */
.gao-admin-modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px); z-index: 100;
  display: flex; align-items: center; justify-content: center;
  animation: gao-admin-fade-in 0.2s ease-out;
}
.gao-admin-modal {
  background: var(--gao-surface); border-radius: var(--gao-radius-xl);
  box-shadow: var(--gao-shadow-xl); width: 100%; max-width: 520px;
  margin: var(--gao-space-4); animation: gao-admin-scale-in 0.2s ease-out;
}
.gao-admin-modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--gao-space-5) var(--gao-space-6); border-bottom: 1px solid var(--gao-border-light); }
.gao-admin-modal-body { padding: var(--gao-space-6); }
.gao-admin-modal-footer { display: flex; justify-content: flex-end; gap: var(--gao-space-3); padding: var(--gao-space-4) var(--gao-space-6); border-top: 1px solid var(--gao-border-light); }

/* ── Progress ── */
.gao-admin-progress { height: 8px; background: var(--gao-gray-100); border-radius: var(--gao-radius-full); overflow: hidden; }
.gao-admin-progress-fill { height: 100%; background: var(--gao-primary); border-radius: var(--gao-radius-full); transition: width var(--gao-transition-base); }

/* ── Avatar ── */
.gao-admin-avatar {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--gao-radius-full); overflow: hidden;
  background: var(--gao-primary-bg); color: var(--gao-primary);
  font-weight: 600; font-size: 0.875rem;
}
.gao-admin-avatar-sm { width: 32px; height: 32px; font-size: 0.75rem; }
.gao-admin-avatar-md { width: 40px; height: 40px; }
.gao-admin-avatar-lg { width: 48px; height: 48px; font-size: 1rem; }
.gao-admin-avatar img { width: 100%; height: 100%; object-fit: cover; }
.gao-admin-avatar-status { position: relative; }
.gao-admin-avatar-status::after { content: ''; position: absolute; bottom: 1px; right: 1px; width: 10px; height: 10px; border-radius: 50%; background: var(--gao-success); border: 2px solid var(--gao-surface); }

/* ── Empty State ── */
.gao-admin-empty { text-align: center; padding: var(--gao-space-12) var(--gao-space-6); color: var(--gao-text-muted); }
.gao-admin-empty svg { margin-bottom: var(--gao-space-4); opacity: 0.5; }
.gao-admin-empty-title { font-size: 1.125rem; font-weight: 600; color: var(--gao-text-secondary); margin-bottom: var(--gao-space-2); }

/* ── Alert ── */
.gao-admin-alert {
  display: flex; align-items: flex-start; gap: var(--gao-space-3);
  padding: var(--gao-space-4); border-radius: var(--gao-radius-lg);
  font-size: 0.875rem; margin-bottom: var(--gao-space-4);
}
.gao-admin-alert-success { background: var(--gao-success-bg); color: var(--gao-success); }
.gao-admin-alert-warning { background: var(--gao-warning-bg); color: var(--gao-warning); }
.gao-admin-alert-danger { background: var(--gao-danger-bg); color: var(--gao-danger); }
.gao-admin-alert-info { background: var(--gao-info-bg); color: var(--gao-info); }

/* ── Dropdown ── */
.gao-admin-dropdown { position: relative; }
.gao-admin-dropdown-menu {
  position: absolute; top: 100%; right: 0;
  min-width: 180px; padding: var(--gao-space-1) 0;
  background: var(--gao-surface); border: 1px solid var(--gao-border-light);
  border-radius: var(--gao-radius-lg); box-shadow: var(--gao-shadow-lg);
  z-index: 60; opacity: 0; visibility: hidden;
  transform: translateY(4px); transition: all var(--gao-transition-fast);
}
.gao-admin-dropdown.open .gao-admin-dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0); }
.gao-admin-dropdown-item {
  display: flex; align-items: center; gap: var(--gao-space-2);
  padding: var(--gao-space-2) var(--gao-space-4);
  font-size: 0.875rem; color: var(--gao-text);
  cursor: pointer; transition: background var(--gao-transition-fast);
}
.gao-admin-dropdown-item:hover { background: var(--gao-gray-50); }
.gao-admin-dropdown-divider { height: 1px; background: var(--gao-border-light); margin: var(--gao-space-1) 0; }

/* ── Tabs ── */
.gao-admin-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--gao-border-light); margin-bottom: var(--gao-space-6); }
.gao-admin-tab {
  padding: var(--gao-space-3) var(--gao-space-4);
  font-size: 0.875rem; font-weight: 500;
  color: var(--gao-text-secondary); cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: all var(--gao-transition-fast);
}
.gao-admin-tab:hover { color: var(--gao-text); }
.gao-admin-tab.active { color: var(--gao-primary); border-bottom-color: var(--gao-primary); }`;

// ─── Utilities & Grid ────────────────────────────────────────

const UTILITIES = `
/* ── Grid ── */
.gao-admin-grid { display: grid; gap: var(--gao-space-6); }
.gao-admin-grid-2 { grid-template-columns: repeat(2, 1fr); }
.gao-admin-grid-3 { grid-template-columns: repeat(3, 1fr); }
.gao-admin-grid-4 { grid-template-columns: repeat(4, 1fr); }
.gao-admin-grid-auto { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

/* ── Flex ── */
.gao-admin-flex { display: flex; }
.gao-admin-flex-between { display: flex; align-items: center; justify-content: space-between; }
.gao-admin-flex-center { display: flex; align-items: center; justify-content: center; }
.gao-admin-gap-2 { gap: var(--gao-space-2); }
.gao-admin-gap-3 { gap: var(--gao-space-3); }
.gao-admin-gap-4 { gap: var(--gao-space-4); }

/* ── Spacing ── */
.gao-admin-mt-4 { margin-top: var(--gao-space-4); }
.gao-admin-mt-6 { margin-top: var(--gao-space-6); }
.gao-admin-mb-4 { margin-bottom: var(--gao-space-4); }
.gao-admin-mb-6 { margin-bottom: var(--gao-space-6); }

/* ── Text ── */
.gao-admin-text-center { text-align: center; }
.gao-admin-text-right { text-align: right; }
.gao-admin-text-muted { color: var(--gao-text-muted); }
.gao-admin-text-success { color: var(--gao-success); }
.gao-admin-text-danger { color: var(--gao-danger); }
.gao-admin-text-warning { color: var(--gao-warning); }
.gao-admin-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`;

// ─── Animations ──────────────────────────────────────────────

const ANIMATIONS = `
/* ── Animations ── */
@keyframes gao-admin-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes gao-admin-slide-in { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
@keyframes gao-admin-scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes gao-admin-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes gao-admin-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes gao-admin-skeleton { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

.gao-admin-skeleton {
  background: linear-gradient(90deg, var(--gao-gray-100) 25%, var(--gao-gray-200) 50%, var(--gao-gray-100) 75%);
  background-size: 200% 100%;
  animation: gao-admin-skeleton 1.5s infinite;
  border-radius: var(--gao-radius-md);
}`;

// ─── Responsive ──────────────────────────────────────────────

const RESPONSIVE = `
/* ── Responsive ── */
@media (max-width: 1024px) {
  .gao-admin-grid-4 { grid-template-columns: repeat(2, 1fr); }
  .gao-admin-grid-3 { grid-template-columns: repeat(2, 1fr); }
  .gao-admin-navbar-toggle { display: flex; }
}

@media (max-width: 768px) {
  .gao-admin-layout {
    grid-template-columns: 1fr;
    grid-template-areas: "navbar" "content";
  }

  .gao-admin-sidebar {
    position: fixed;
    left: -100%;
    top: 0;
    bottom: 0;
    width: var(--gao-sidebar-width);
    z-index: 100;
    transition: left var(--gao-transition-base);
  }

  .gao-admin-sidebar.open { left: 0; }

  .gao-admin-grid-2,
  .gao-admin-grid-3,
  .gao-admin-grid-4 { grid-template-columns: 1fr; }

  .gao-admin-content { padding: var(--gao-space-4); }
  .gao-admin-search { display: none; }
  .gao-admin-navbar-toggle { display: flex; }

  .gao-admin-page-header { flex-direction: column; align-items: flex-start; gap: var(--gao-space-3); }
}

@media (max-width: 480px) {
  .gao-admin-content { padding: var(--gao-space-3); }
  .gao-admin-card { padding: var(--gao-space-4); }
  .gao-admin-stat-card { flex-direction: column; gap: var(--gao-space-3); }
}`;

// ─── Export ──────────────────────────────────────────────────

/**
 * Complete admin CSS design system.
 * Includes: tokens, dark mode, reset, typography, layout, components,
 * utilities, animations, and responsive breakpoints.
 */
export const adminCSS: string = [
    COLOR_SYSTEM,
    DARK_MODE,
    RESET_AND_TYPOGRAPHY,
    LAYOUT,
    COMPONENTS,
    UTILITIES,
    ANIMATIONS,
    RESPONSIVE,
].join('\n');

/**
 * Generate `<style>` tag containing the full admin CSS.
 */
export function injectAdminCSS(): string {
    return `<style id="gao-admin-styles">\n${adminCSS}\n</style>`;
}
