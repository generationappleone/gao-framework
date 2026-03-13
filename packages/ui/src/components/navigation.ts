/**
 * @gao/ui — Navigation Components
 *
 * Navbar, Tabs, and Pagination.
 *
 * @since 0.6.0
 */

// ─── Types ───────────────────────────────────────────────────

export interface NavItem {
    label: string;
    href: string;
    active?: boolean;
    icon?: string;
}

export interface NavbarConfig {
    brand: { name: string; href?: string; icon?: string };
    items: NavItem[];
    actions?: string;
    sticky?: boolean;
    glass?: boolean;
    className?: string;
}

export interface TabItem {
    label: string;
    content: string;
    icon?: string;
    active?: boolean;
}

export interface TabsConfig {
    tabs: TabItem[];
    variant?: 'default' | 'pills' | 'underline';
    id?: string;
    className?: string;
}

export interface PaginationConfig {
    current: number;
    total: number;
    perPage: number;
    baseUrl: string;
    maxVisible?: number;
    className?: string;
}

// ─── Components ──────────────────────────────────────────────

/**
 * Responsive navbar with brand, nav items, and actions.
 */
export function gaoNavbar(config: NavbarConfig): string {
    const { brand, items, actions = '', sticky = false, glass = false, className = '' } = config;
    const cls = [
        'gao-navbar',
        sticky ? 'gao-navbar-sticky' : '',
        glass ? 'gao-navbar-glass' : '',
        className,
    ].filter(Boolean).join(' ');

    const brandHref = brand.href ?? '/';
    const brandHtml = `<a href="${brandHref}" class="gao-navbar-brand">${brand.name}</a>`;

    const navHtml = items.map(item => {
        const activeClass = item.active ? ' gao-navbar-link-active' : '';
        return `<a href="${item.href}" class="gao-navbar-link${activeClass}">${item.label}</a>`;
    }).join('\n');

    const toggleHtml = `<button class="gao-navbar-toggle" aria-label="Toggle navigation" onclick="this.parentElement.querySelector('.gao-navbar-nav').classList.toggle('open')">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
</button>`;

    return `<nav class="${cls}" role="navigation">
${brandHtml}
<div class="gao-navbar-nav">${navHtml}</div>
<div class="gao-navbar-actions">${actions}${toggleHtml}</div>
</nav>`;
}

/**
 * Tabbed interface with CSS + minimal JS switching.
 */
export function gaoTabs(config: TabsConfig): string {
    const { tabs, variant = 'default', id, className = '' } = config;
    const tabsId = id ?? `gao-tabs-${Math.random().toString(36).slice(2, 8)}`;
    const variantClass = variant === 'pills' ? ' gao-tabs-pills' : '';
    const cls = `gao-tabs${variantClass} ${className}`.trim();

    const triggers = tabs.map((tab, i) => {
        const active = tab.active || (i === 0 && !tabs.some(t => t.active));
        const selectedAttr = active ? ' aria-selected="true"' : ' aria-selected="false"';
        const activeClass = active ? ' active' : '';
        return `<button class="gao-tab-trigger${activeClass}" role="tab"${selectedAttr} data-tab="${tabsId}-${i}" onclick="document.querySelectorAll('[data-tab-group=\\'${tabsId}\\'] .gao-tab-panel').forEach(p=>p.classList.remove('active'));document.querySelectorAll('[data-tab-group=\\'${tabsId}\\'] .gao-tab-trigger').forEach(t=>{t.classList.remove('active');t.setAttribute('aria-selected','false')});this.classList.add('active');this.setAttribute('aria-selected','true');document.getElementById('${tabsId}-${i}').classList.add('active')">${tab.label}</button>`;
    }).join('\n');

    const panels = tabs.map((tab, i) => {
        const active = tab.active || (i === 0 && !tabs.some(t => t.active));
        const activeClass = active ? ' active' : '';
        return `<div id="${tabsId}-${i}" class="gao-tab-panel${activeClass}" role="tabpanel">${tab.content}</div>`;
    }).join('\n');

    return `<div class="${cls}" data-tab-group="${tabsId}">
<div class="gao-tabs-list" role="tablist">${triggers}</div>
<div class="gao-tab-content">${panels}</div>
</div>`;
}

/**
 * Page navigation with ellipsis collapse.
 */
export function gaoPagination(config: PaginationConfig): string {
    const { current, total, perPage, baseUrl, maxVisible = 5, className = '' } = config;
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) return '';

    const cls = `gao-pagination ${className}`.trim();

    const pageUrl = (page: number): string => {
        const sep = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${sep}page=${page}`;
    };

    const items: string[] = [];

    // Previous
    if (current > 1) {
        items.push(`<a href="${pageUrl(current - 1)}" class="gao-pagination-item" aria-label="Previous">&laquo;</a>`);
    } else {
        items.push(`<span class="gao-pagination-item gao-pagination-item-disabled" aria-disabled="true">&laquo;</span>`);
    }

    // Page numbers with ellipsis
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
        items.push(`<a href="${pageUrl(1)}" class="gao-pagination-item">1</a>`);
        if (start > 2) items.push(`<span class="gao-pagination-item gao-pagination-ellipsis">&hellip;</span>`);
    }

    for (let i = start; i <= end; i++) {
        if (i === current) {
            items.push(`<span class="gao-pagination-item gao-pagination-item-active" aria-current="page">${i}</span>`);
        } else {
            items.push(`<a href="${pageUrl(i)}" class="gao-pagination-item">${i}</a>`);
        }
    }

    if (end < totalPages) {
        if (end < totalPages - 1) items.push(`<span class="gao-pagination-item gao-pagination-ellipsis">&hellip;</span>`);
        items.push(`<a href="${pageUrl(totalPages)}" class="gao-pagination-item">${totalPages}</a>`);
    }

    // Next
    if (current < totalPages) {
        items.push(`<a href="${pageUrl(current + 1)}" class="gao-pagination-item" aria-label="Next">&raquo;</a>`);
    } else {
        items.push(`<span class="gao-pagination-item gao-pagination-item-disabled" aria-disabled="true">&raquo;</span>`);
    }

    return `<nav class="${cls}" aria-label="Pagination">\n${items.join('\n')}\n</nav>`;
}
