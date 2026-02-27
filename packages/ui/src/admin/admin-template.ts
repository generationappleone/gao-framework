/**
 * @gao/ui — Admin Template Layout Generator
 *
 * Generates complete HTML pages for admin panels using GaoType fonts,
 * GaoIcons, and the GaoAdmin glassmorphism design system.
 */

import { gaoIcon } from '../icons/icon-registry.js';
import { injectFonts } from '../fonts/font-registry.js';
import { adminCSS, injectAdminCSS } from './admin-styles.js';
import type { GaoIconName } from '../icons/icon-types.js';

// ─── Types ───────────────────────────────────────────────────

export interface SidebarItem {
    label: string;
    icon: GaoIconName;
    href?: string;
    active?: boolean;
    badge?: string;
    section?: string;
}

export interface NavbarConfig {
    showSearch?: boolean;
    user?: { name: string; avatar?: string; role?: string };
    notifications?: number;
}

export interface AdminLayoutConfig {
    title: string;
    brandName?: string;
    brandIcon?: GaoIconName;
    sidebar: SidebarItem[];
    navbar?: NavbarConfig;
    content: string;
    footer?: string;
    fonts?: string[];
}

export interface DashboardStat {
    label: string;
    value: string | number;
    icon: GaoIconName;
    trend?: { value: string; direction: 'up' | 'down' };
    color?: string;
}

export interface DashboardConfig extends Omit<AdminLayoutConfig, 'content'> {
    stats: DashboardStat[];
    chartHtml?: string;
    recentTitle?: string;
    recentHtml?: string;
}

// ─── Template Builder ────────────────────────────────────────

export const createAdminTemplate = {
    /**
     * Generate the full admin CSS.
     */
    css(): string {
        return adminCSS;
    },

    /**
     * Generate a full admin HTML page.
     */
    layout(config: AdminLayoutConfig): string {
        const {
            title,
            brandName = 'GaoAdmin',
            brandIcon = 'layout' as GaoIconName,
            sidebar: sidebarItems,
            navbar = {},
            content,
            footer,
        } = config;

        const sidebarHtml = this.sidebar(sidebarItems, brandName, brandIcon);
        const navbarHtml = this.navbar(navbar);
        const footerHtml = footer ? `<footer class="gao-admin-footer">${footer}</footer>` : this.footer();
        const fontsHtml = injectFonts(config.fonts as any);
        const stylesHtml = injectAdminCSS();

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${fontsHtml}
  ${stylesHtml}
</head>
<body>
<div class="gao-admin-wrapper">
  <div class="gao-admin-layout">
    ${sidebarHtml}
    ${navbarHtml}
    <main class="gao-admin-content">
      ${content}
    </main>
  </div>
  ${footerHtml}
</div>
<script>${adminScriptsInline()}</script>
</body>
</html>`;
    },

    /**
     * Generate sidebar HTML.
     */
    sidebar(items: SidebarItem[], brandName = 'GaoAdmin', brandIcon: GaoIconName = 'layout'): string {
        let currentSection = '';
        const navItems: string[] = [];

        for (const item of items) {
            if (item.section && item.section !== currentSection) {
                currentSection = item.section;
                navItems.push(`<div class="gao-admin-sidebar-section">${escapeHtml(currentSection)}</div>`);
            }

            const activeClass = item.active ? ' active' : '';
            const href = item.href ?? '#';
            const icon = gaoIcon(item.icon, { size: 20 });
            const badge = item.badge
                ? `<span class="gao-admin-badge gao-admin-badge-primary" style="margin-left:auto">${escapeHtml(item.badge)}</span>`
                : '';

            navItems.push(
                `<a href="${escapeHtml(href)}" class="gao-admin-sidebar-item${activeClass}">${icon}<span>${escapeHtml(item.label)}</span>${badge}</a>`
            );
        }

        return `<aside class="gao-admin-sidebar">
  <div class="gao-admin-sidebar-brand">
    ${gaoIcon(brandIcon, { size: 28, color: 'var(--gao-primary)' })}
    <span>${escapeHtml(brandName)}</span>
  </div>
  <nav class="gao-admin-sidebar-nav">
    ${navItems.join('\n    ')}
  </nav>
  <div class="gao-admin-sidebar-footer">
    <div class="gao-admin-small">© ${new Date().getFullYear()} ${escapeHtml(brandName)}</div>
  </div>
</aside>`;
    },

    /**
     * Generate navbar HTML.
     */
    navbar(config: NavbarConfig = {}): string {
        const { showSearch = true, user, notifications } = config;

        const searchHtml = showSearch
            ? `<div class="gao-admin-search">
           ${gaoIcon('search', { size: 16, color: 'var(--gao-text-muted)' })}
           <input type="text" placeholder="Search... (Ctrl+K)" aria-label="Search" />
         </div>`
            : '';

        const notifBadge = notifications && notifications > 0
            ? `<span class="gao-admin-badge gao-admin-badge-danger" style="position:absolute;top:-4px;right:-4px;font-size:0.625rem;padding:0 0.3rem">${notifications > 99 ? '99+' : notifications}</span>`
            : '';

        const userHtml = user
            ? `<div class="gao-admin-dropdown">
           <button class="gao-admin-btn gao-admin-btn-ghost gao-admin-dropdown-trigger" style="gap:var(--gao-space-2)">
             <div class="gao-admin-avatar gao-admin-avatar-sm">${user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}" />` : getInitials(user.name)}</div>
             <span style="font-size:0.875rem">${escapeHtml(user.name)}</span>
             ${gaoIcon('chevron-down', { size: 14 })}
           </button>
           <div class="gao-admin-dropdown-menu">
             <div class="gao-admin-dropdown-item">${gaoIcon('edit', { size: 16 })} Profile</div>
             <div class="gao-admin-dropdown-item">${gaoIcon('lock', { size: 16 })} Settings</div>
             <div class="gao-admin-dropdown-divider"></div>
             <div class="gao-admin-dropdown-item">${gaoIcon('power', { size: 16 })} Logout</div>
           </div>
         </div>`
            : '';

        return `<header class="gao-admin-navbar">
  <div class="gao-admin-navbar-left">
    <button class="gao-admin-navbar-toggle" aria-label="Toggle sidebar">
      ${gaoIcon('menu', { size: 20 })}
    </button>
    ${searchHtml}
  </div>
  <div class="gao-admin-navbar-right">
    <button class="gao-admin-btn gao-admin-btn-ghost gao-admin-btn-icon gao-admin-theme-toggle" aria-label="Toggle dark mode">
      ${gaoIcon('moon', { size: 18 })}
    </button>
    <div style="position:relative">
      <button class="gao-admin-btn gao-admin-btn-ghost gao-admin-btn-icon" aria-label="Notifications">
        ${gaoIcon('bell', { size: 18 })}
        ${notifBadge}
      </button>
    </div>
    ${userHtml}
  </div>
</header>`;
    },

    /**
     * Generate default footer.
     */
    footer(): string {
        return `<footer class="gao-admin-footer" style="text-align:center;padding:var(--gao-space-4);font-size:0.75rem;color:var(--gao-text-muted);border-top:1px solid var(--gao-border-light)">
  Powered by <strong>GAO Framework</strong> — Zero Dependencies Admin
</footer>`;
    },
};

// ─── Inline Admin Scripts ────────────────────────────────────

function adminScriptsInline(): string {
    return `(function(){
  // Sidebar toggle
  var toggle = document.querySelector('.gao-admin-navbar-toggle');
  var sidebar = document.querySelector('.gao-admin-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
  }
  // Dark mode toggle
  var themeBtn = document.querySelector('.gao-admin-theme-toggle');
  if (themeBtn) {
    var html = document.documentElement;
    var saved = localStorage.getItem('gao-theme');
    if (saved) html.setAttribute('data-theme', saved);
    themeBtn.addEventListener('click', function() {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('gao-theme', next);
    });
  }
  // Dropdown toggle
  document.querySelectorAll('.gao-admin-dropdown-trigger').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      btn.closest('.gao-admin-dropdown').classList.toggle('open');
    });
  });
  document.addEventListener('click', function() {
    document.querySelectorAll('.gao-admin-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
  });
  // Keyboard shortcut Ctrl+K for search
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      var input = document.querySelector('.gao-admin-search input');
      if (input) input.focus();
    }
  });
})();`;
}

// ─── Utilities ───────────────────────────────────────────────

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
