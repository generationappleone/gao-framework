/**
 * @gao/ui — Component Styles
 *
 * Shared CSS for all general-purpose UI components.
 * Uses design tokens from the GAO design system.
 * All classes use the `.gao-` prefix (no `-admin-` prefix).
 *
 * @since 0.6.0
 */

export const componentCSS: string = `
/* ═══════════════════════════════════════════════════════════
 * GAO Component Styles v0.6.0
 * Shared CSS for general UI components
 * ═══════════════════════════════════════════════════════════ */

/* ── Button ── */
.gao-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gao-space-2);
  padding: var(--gao-space-2) var(--gao-space-4);
  font-size: var(--gao-text-sm);
  font-weight: var(--gao-font-medium, 500);
  font-family: inherit;
  line-height: var(--gao-leading-normal, 1.5);
  border-radius: var(--gao-radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--gao-transition-fast);
  white-space: nowrap;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  user-select: none;
}

.gao-btn:focus-visible {
  outline: 2px solid var(--gao-primary);
  outline-offset: 2px;
}

.gao-btn:disabled,
.gao-btn[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* ── Button Variants ── */
.gao-btn-primary {
  background: var(--gao-primary);
  color: var(--gao-text-inverse);
  border-color: var(--gao-primary);
}
.gao-btn-primary:hover { background: var(--gao-primary-dark); border-color: var(--gao-primary-dark); }

.gao-btn-secondary {
  background: var(--gao-gray-100);
  color: var(--gao-text);
  border-color: var(--gao-border);
}
.gao-btn-secondary:hover { background: var(--gao-gray-200); }

.gao-btn-danger {
  background: var(--gao-danger);
  color: var(--gao-text-inverse);
  border-color: var(--gao-danger);
}
.gao-btn-danger:hover { background: hsl(350, 72%, 44%); }

.gao-btn-ghost {
  background: transparent;
  color: var(--gao-text-secondary);
}
.gao-btn-ghost:hover { background: var(--gao-gray-100); color: var(--gao-text); }

.gao-btn-outline {
  background: transparent;
  color: var(--gao-primary);
  border-color: var(--gao-primary);
}
.gao-btn-outline:hover { background: var(--gao-primary); color: var(--gao-text-inverse); }

/* ── Button Sizes ── */
.gao-btn-sm { padding: var(--gao-space-1) var(--gao-space-3); font-size: var(--gao-text-xs); }
.gao-btn-lg { padding: var(--gao-space-3) var(--gao-space-6); font-size: var(--gao-text-base); }
.gao-btn-icon { padding: var(--gao-space-2); }

/* ── Button Loading ── */
.gao-btn-loading { pointer-events: none; }
.gao-btn-loading .gao-btn-label { opacity: 0; }
.gao-btn-loading::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: gao-spin 0.6s linear infinite;
}

/* ── Button Ripple ── */
.gao-btn-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: gao-ripple 0.6s ease-out;
  pointer-events: none;
}

/* ── Button Group ── */
.gao-btn-group {
  display: inline-flex;
  border-radius: var(--gao-radius-md);
}
.gao-btn-group .gao-btn { border-radius: 0; }
.gao-btn-group .gao-btn:first-child { border-radius: var(--gao-radius-md) 0 0 var(--gao-radius-md); }
.gao-btn-group .gao-btn:last-child { border-radius: 0 var(--gao-radius-md) var(--gao-radius-md) 0; }
.gao-btn-group .gao-btn + .gao-btn { margin-left: -1px; }
.gao-btn-group-vertical { flex-direction: column; }
.gao-btn-group-vertical .gao-btn:first-child { border-radius: var(--gao-radius-md) var(--gao-radius-md) 0 0; }
.gao-btn-group-vertical .gao-btn:last-child { border-radius: 0 0 var(--gao-radius-md) var(--gao-radius-md); }
.gao-btn-group-vertical .gao-btn + .gao-btn { margin-left: 0; margin-top: -1px; }

/* ── Dropdown ── */
.gao-dropdown { position: relative; display: inline-block; }
.gao-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  padding: var(--gao-space-1) 0;
  margin-top: var(--gao-space-1);
  background: var(--gao-surface);
  border: 1px solid var(--gao-border-light);
  border-radius: var(--gao-radius-lg);
  box-shadow: var(--gao-shadow-lg);
  z-index: var(--gao-z-dropdown, 10);
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px);
  transition: all var(--gao-transition-fast);
}
.gao-dropdown-menu-right { left: auto; right: 0; }
.gao-dropdown.open .gao-dropdown-menu,
.gao-dropdown:focus-within .gao-dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.gao-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--gao-space-2);
  padding: var(--gao-space-2) var(--gao-space-4);
  font-size: var(--gao-text-sm);
  color: var(--gao-text);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--gao-transition-fast);
}
.gao-dropdown-item:hover { background: var(--gao-gray-50); }
.gao-dropdown-item-active { background: var(--gao-primary-bg); color: var(--gao-primary); }
.gao-dropdown-divider { height: 1px; background: var(--gao-border-light); margin: var(--gao-space-1) 0; }

/* ── Card ── */
.gao-card {
  background: var(--gao-surface);
  border: 1px solid var(--gao-border-light);
  border-radius: var(--gao-radius-lg);
  overflow: hidden;
  transition: box-shadow var(--gao-transition-fast), transform var(--gao-transition-fast);
}
.gao-card:hover { box-shadow: var(--gao-shadow-md); }
.gao-card-outlined { box-shadow: none; border: 1px solid var(--gao-border); }
.gao-card-elevated { box-shadow: var(--gao-shadow-lg); border: none; }
.gao-card-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.gao-card-header { padding: var(--gao-space-4) var(--gao-space-5); border-bottom: 1px solid var(--gao-border-light); }
.gao-card-body { padding: var(--gao-space-5); }
.gao-card-footer { padding: var(--gao-space-4) var(--gao-space-5); border-top: 1px solid var(--gao-border-light); }
.gao-card-image { width: 100%; height: auto; display: block; }
.gao-card-title { font-size: var(--gao-text-lg); font-weight: var(--gao-font-semibold, 600); color: var(--gao-text); margin-bottom: var(--gao-space-1); }
.gao-card-subtitle { font-size: var(--gao-text-sm); color: var(--gao-text-muted); }

/* ── Form Elements ── */
.gao-form-group { margin-bottom: var(--gao-space-4); }
.gao-label {
  display: block;
  font-size: var(--gao-text-sm);
  font-weight: var(--gao-font-medium, 500);
  color: var(--gao-text);
  margin-bottom: var(--gao-space-1);
}
.gao-label-required::after { content: ' *'; color: var(--gao-danger); }

.gao-input {
  width: 100%;
  padding: var(--gao-space-2) var(--gao-space-3);
  font-size: var(--gao-text-sm);
  font-family: inherit;
  color: var(--gao-text);
  background: var(--gao-surface);
  border: 1px solid var(--gao-border);
  border-radius: var(--gao-radius-md);
  transition: all var(--gao-transition-fast);
  outline: none;
}
.gao-input:focus { border-color: var(--gao-primary); box-shadow: 0 0 0 3px var(--gao-primary-bg); }
.gao-input:disabled { background: var(--gao-gray-50); cursor: not-allowed; opacity: 0.7; }
.gao-input::placeholder { color: var(--gao-text-muted); }
.gao-input-error { border-color: var(--gao-danger); }
.gao-input-error:focus { box-shadow: 0 0 0 3px hsl(350, 72%, 96%); }
.gao-input-sm { padding: var(--gao-space-1) var(--gao-space-2); font-size: var(--gao-text-xs); }
.gao-input-lg { padding: var(--gao-space-3) var(--gao-space-4); font-size: var(--gao-text-base); }

.gao-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235C636E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

.gao-hint { font-size: var(--gao-text-xs); color: var(--gao-text-muted); margin-top: var(--gao-space-1); }
.gao-error-message { font-size: var(--gao-text-xs); color: var(--gao-danger); margin-top: var(--gao-space-1); }

/* ── Checkbox & Radio ── */
.gao-checkbox,
.gao-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--gao-space-2);
  cursor: pointer;
  font-size: var(--gao-text-sm);
  color: var(--gao-text);
  user-select: none;
}
.gao-checkbox input,
.gao-radio input {
  width: 18px; height: 18px;
  accent-color: var(--gao-primary);
  cursor: pointer;
}

/* ── Switch Toggle ── */
.gao-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--gao-space-2);
  cursor: pointer;
  font-size: var(--gao-text-sm);
  user-select: none;
}
.gao-switch-track {
  width: 44px; height: 24px;
  background: var(--gao-gray-300);
  border-radius: var(--gao-radius-full);
  position: relative;
  transition: background var(--gao-transition-fast);
}
.gao-switch input { display: none; }
.gao-switch-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 20px; height: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: var(--gao-shadow-sm);
  transition: transform var(--gao-transition-fast);
}
.gao-switch input:checked + .gao-switch-track { background: var(--gao-primary); }
.gao-switch input:checked + .gao-switch-track .gao-switch-thumb { transform: translateX(20px); }
.gao-switch input:disabled + .gao-switch-track { opacity: 0.5; cursor: not-allowed; }

/* ── Alert ── */
.gao-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--gao-space-3);
  padding: var(--gao-space-4);
  border-radius: var(--gao-radius-lg);
  font-size: var(--gao-text-sm);
  line-height: var(--gao-leading-normal);
  position: relative;
}
.gao-alert-success { background: var(--gao-success-bg); color: var(--gao-success); }
.gao-alert-warning { background: var(--gao-warning-bg); color: var(--gao-warning); }
.gao-alert-danger { background: var(--gao-danger-bg); color: var(--gao-danger); }
.gao-alert-info { background: var(--gao-info-bg); color: var(--gao-info); }
.gao-alert-content { flex: 1; }
.gao-alert-title { font-weight: var(--gao-font-semibold, 600); margin-bottom: var(--gao-space-1); }
.gao-alert-close {
  background: none; border: none; cursor: pointer;
  color: currentColor; opacity: 0.6;
  padding: var(--gao-space-1);
  transition: opacity var(--gao-transition-fast);
}
.gao-alert-close:hover { opacity: 1; }

/* ── Tooltip ── */
.gao-tooltip {
  position: relative;
  display: inline-block;
}
.gao-tooltip-text {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  z-index: var(--gao-z-tooltip, 80);
  padding: var(--gao-space-1) var(--gao-space-2);
  font-size: var(--gao-text-xs);
  color: var(--gao-text-inverse);
  background: var(--gao-gray-900);
  border-radius: var(--gao-radius-sm);
  white-space: nowrap;
  transition: all var(--gao-transition-fast);
  pointer-events: none;
}
.gao-tooltip:hover .gao-tooltip-text,
.gao-tooltip:focus-within .gao-tooltip-text { visibility: visible; opacity: 1; }
.gao-tooltip-top .gao-tooltip-text { bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-4px); }
.gao-tooltip-bottom .gao-tooltip-text { top: 100%; left: 50%; transform: translateX(-50%) translateY(4px); }
.gao-tooltip-left .gao-tooltip-text { right: 100%; top: 50%; transform: translateY(-50%) translateX(-4px); }
.gao-tooltip-right .gao-tooltip-text { left: 100%; top: 50%; transform: translateY(-50%) translateX(4px); }

/* ── Spinner ── */
.gao-spinner {
  display: inline-block;
}
.gao-spinner-ring {
  border: 3px solid var(--gao-gray-200);
  border-top-color: var(--gao-primary);
  border-radius: 50%;
  animation: gao-spin 0.6s linear infinite;
}
.gao-spinner-sm { width: 16px; height: 16px; }
.gao-spinner-md { width: 24px; height: 24px; }
.gao-spinner-lg { width: 40px; height: 40px; }
.gao-spinner-dots {
  display: flex; gap: 4px; align-items: center;
}
.gao-spinner-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--gao-primary);
  animation: gao-dot-bounce 1.4s ease-in-out infinite both;
}
.gao-spinner-dot:nth-child(2) { animation-delay: 0.16s; }
.gao-spinner-dot:nth-child(3) { animation-delay: 0.32s; }

/* ── Accordion ── */
.gao-accordion { border: 1px solid var(--gao-border-light); border-radius: var(--gao-radius-lg); overflow: hidden; }
.gao-accordion details { border-bottom: 1px solid var(--gao-border-light); }
.gao-accordion details:last-child { border-bottom: none; }
.gao-accordion summary {
  padding: var(--gao-space-4) var(--gao-space-5);
  font-weight: var(--gao-font-medium, 500);
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background var(--gao-transition-fast);
  user-select: none;
}
.gao-accordion summary:hover { background: var(--gao-gray-50); }
.gao-accordion summary::-webkit-details-marker { display: none; }
.gao-accordion summary::after {
  content: '';
  width: 8px; height: 8px;
  border-right: 2px solid var(--gao-text-muted);
  border-bottom: 2px solid var(--gao-text-muted);
  transform: rotate(-45deg);
  transition: transform var(--gao-transition-fast);
  flex-shrink: 0;
}
.gao-accordion details[open] summary::after { transform: rotate(45deg); }
.gao-accordion-content { padding: 0 var(--gao-space-5) var(--gao-space-5); }

/* ── List Group ── */
.gao-list-group { border: 1px solid var(--gao-border-light); border-radius: var(--gao-radius-lg); overflow: hidden; }
.gao-list-group-flush { border: none; border-radius: 0; }
.gao-list-group-item {
  display: flex;
  align-items: center;
  gap: var(--gao-space-3);
  padding: var(--gao-space-3) var(--gao-space-4);
  border-bottom: 1px solid var(--gao-border-light);
  font-size: var(--gao-text-sm);
  color: var(--gao-text);
  text-decoration: none;
  transition: background var(--gao-transition-fast);
}
.gao-list-group-item:last-child { border-bottom: none; }
.gao-list-group-item:hover { background: var(--gao-gray-50); }
.gao-list-group-item-active { background: var(--gao-primary-bg); color: var(--gao-primary); font-weight: var(--gao-font-medium); }
.gao-list-group-item-badge { margin-left: auto; }

/* ── Skeleton ── */
.gao-skeleton {
  background: linear-gradient(90deg, var(--gao-gray-100) 25%, var(--gao-gray-200) 50%, var(--gao-gray-100) 75%);
  background-size: 200% 100%;
  animation: gao-shimmer 1.5s infinite;
  border-radius: var(--gao-radius-md);
}
.gao-skeleton-text { height: 1em; margin-bottom: var(--gao-space-2); }
.gao-skeleton-text:last-child { width: 70%; }
.gao-skeleton-circle { border-radius: 50%; }
.gao-skeleton-card { height: 200px; }

/* ── Tabs ── */
.gao-tabs-list {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--gao-border-light);
}
.gao-tab-trigger {
  padding: var(--gao-space-3) var(--gao-space-4);
  font-size: var(--gao-text-sm);
  font-weight: var(--gao-font-medium, 500);
  color: var(--gao-text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all var(--gao-transition-fast);
}
.gao-tab-trigger:hover { color: var(--gao-text); }
.gao-tab-trigger[aria-selected="true"],
.gao-tab-trigger.active { color: var(--gao-primary); border-bottom-color: var(--gao-primary); }
.gao-tab-content { padding: var(--gao-space-4) 0; }
.gao-tab-panel { display: none; }
.gao-tab-panel.active { display: block; }

/* ── Tabs Pills Variant ── */
.gao-tabs-pills .gao-tabs-list { border-bottom: none; gap: var(--gao-space-1); }
.gao-tabs-pills .gao-tab-trigger {
  border-bottom: none;
  border-radius: var(--gao-radius-md);
  margin-bottom: 0;
}
.gao-tabs-pills .gao-tab-trigger[aria-selected="true"],
.gao-tabs-pills .gao-tab-trigger.active {
  background: var(--gao-primary);
  color: var(--gao-text-inverse);
}

/* ── Pagination ── */
.gao-pagination {
  display: flex;
  align-items: center;
  gap: var(--gao-space-1);
}
.gao-pagination-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 var(--gao-space-2);
  font-size: var(--gao-text-sm);
  color: var(--gao-text-secondary);
  background: var(--gao-surface);
  border: 1px solid var(--gao-border);
  border-radius: var(--gao-radius-md);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--gao-transition-fast);
}
.gao-pagination-item:hover { background: var(--gao-gray-50); color: var(--gao-text); }
.gao-pagination-item-active {
  background: var(--gao-primary);
  color: var(--gao-text-inverse);
  border-color: var(--gao-primary);
}
.gao-pagination-item-disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
.gao-pagination-ellipsis { border: none; background: none; cursor: default; }

/* ── Navbar ── */
.gao-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--gao-space-6);
  height: 64px;
  background: var(--gao-surface);
  border-bottom: 1px solid var(--gao-border-light);
}
.gao-navbar-sticky { position: sticky; top: 0; z-index: var(--gao-z-sticky, 20); }
.gao-navbar-glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.gao-navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--gao-space-3);
  font-size: var(--gao-text-lg);
  font-weight: var(--gao-font-bold, 700);
  color: var(--gao-text);
  text-decoration: none;
}
.gao-navbar-nav {
  display: flex;
  align-items: center;
  gap: var(--gao-space-1);
}
.gao-navbar-link {
  padding: var(--gao-space-2) var(--gao-space-3);
  font-size: var(--gao-text-sm);
  font-weight: var(--gao-font-medium, 500);
  color: var(--gao-text-secondary);
  text-decoration: none;
  border-radius: var(--gao-radius-md);
  transition: all var(--gao-transition-fast);
}
.gao-navbar-link:hover { color: var(--gao-text); background: var(--gao-gray-50); }
.gao-navbar-link-active { color: var(--gao-primary); }
.gao-navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--gao-space-2);
}
.gao-navbar-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--gao-text);
  cursor: pointer;
  padding: var(--gao-space-2);
}

@media (max-width: 768px) {
  .gao-navbar-nav { display: none; }
  .gao-navbar-toggle { display: flex; }
  .gao-navbar-nav.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 64px; left: 0; right: 0;
    background: var(--gao-surface);
    border-bottom: 1px solid var(--gao-border);
    padding: var(--gao-space-4);
    box-shadow: var(--gao-shadow-lg);
  }
}

/* ── Carousel ── */
.gao-carousel { position: relative; overflow: hidden; border-radius: var(--gao-radius-lg); }
.gao-carousel-track {
  display: flex;
  scroll-snap-type: x mandatory;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.gao-carousel-track::-webkit-scrollbar { display: none; }
.gao-carousel-slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
}
.gao-carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px; height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--gao-border-light);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: all var(--gao-transition-fast);
  box-shadow: var(--gao-shadow-sm);
}
.gao-carousel-arrow:hover { background: white; box-shadow: var(--gao-shadow-md); }
.gao-carousel-prev { left: var(--gao-space-3); }
.gao-carousel-next { right: var(--gao-space-3); }
.gao-carousel-dots {
  display: flex;
  justify-content: center;
  gap: var(--gao-space-2);
  padding: var(--gao-space-3);
}
.gao-carousel-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--gao-gray-300);
  border: none;
  cursor: pointer;
  transition: all var(--gao-transition-fast);
}
.gao-carousel-dot-active { background: var(--gao-primary); width: 24px; border-radius: var(--gao-radius-full); }

/* ── Offcanvas ── */
.gao-offcanvas-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--gao-z-overlay, 40);
  opacity: 0;
  visibility: hidden;
  transition: all var(--gao-transition-base);
}
.gao-offcanvas-backdrop.open { opacity: 1; visibility: visible; }
.gao-offcanvas {
  position: fixed;
  background: var(--gao-surface);
  z-index: var(--gao-z-modal, 50);
  transition: transform var(--gao-transition-base);
  overflow-y: auto;
}
.gao-offcanvas-left { top: 0; bottom: 0; left: 0; width: 320px; transform: translateX(-100%); }
.gao-offcanvas-right { top: 0; bottom: 0; right: 0; width: 320px; transform: translateX(100%); }
.gao-offcanvas-top { top: 0; left: 0; right: 0; height: auto; max-height: 80vh; transform: translateY(-100%); }
.gao-offcanvas-bottom { bottom: 0; left: 0; right: 0; height: auto; max-height: 80vh; transform: translateY(100%); }
.gao-offcanvas.open { transform: translate(0); }
.gao-offcanvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gao-space-4) var(--gao-space-5);
  border-bottom: 1px solid var(--gao-border-light);
}
.gao-offcanvas-title { font-size: var(--gao-text-lg); font-weight: var(--gao-font-semibold, 600); }
.gao-offcanvas-body { padding: var(--gao-space-5); }
.gao-offcanvas-close {
  background: none; border: none; cursor: pointer;
  color: var(--gao-text-muted); padding: var(--gao-space-1);
  border-radius: var(--gao-radius-sm);
  transition: color var(--gao-transition-fast);
}
.gao-offcanvas-close:hover { color: var(--gao-text); }

/* ── Badge ── */
.gao-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--gao-space-1);
  padding: 0.125rem 0.5rem;
  font-size: var(--gao-text-xs);
  font-weight: var(--gao-font-semibold, 600);
  border-radius: var(--gao-radius-full);
  line-height: var(--gao-leading-normal);
}
.gao-badge-primary { background: var(--gao-primary-bg); color: var(--gao-primary); }
.gao-badge-success { background: var(--gao-success-bg); color: var(--gao-success); }
.gao-badge-warning { background: var(--gao-warning-bg); color: var(--gao-warning); }
.gao-badge-danger { background: var(--gao-danger-bg); color: var(--gao-danger); }
.gao-badge-info { background: var(--gao-info-bg); color: var(--gao-info); }

/* ── Component Animations ── */
@keyframes gao-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes gao-ripple { to { transform: scale(4); opacity: 0; } }
@keyframes gao-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes gao-dot-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
`;
