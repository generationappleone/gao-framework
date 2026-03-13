/**
 * @gao/ui — Data Display Components
 *
 * Card, Accordion, ListGroup, and Skeleton.
 *
 * @since 0.6.0
 */

// ─── Types ───────────────────────────────────────────────────

export interface CardConfig {
    title?: string;
    subtitle?: string;
    body: string;
    header?: string;
    footer?: string;
    image?: { src: string; alt: string };
    variant?: 'default' | 'outlined' | 'elevated' | 'glass';
    className?: string;
}

export interface AccordionItem {
    title: string;
    content: string;
    open?: boolean;
}

export interface AccordionConfig {
    items: AccordionItem[];
    allowMultiple?: boolean;
    className?: string;
}

export interface ListGroupItem {
    label: string;
    icon?: string;
    badge?: string;
    href?: string;
    active?: boolean;
}

export interface ListGroupConfig {
    items: ListGroupItem[];
    variant?: 'default' | 'flush';
    className?: string;
}

export interface SkeletonConfig {
    type?: 'text' | 'circle' | 'rect' | 'card';
    width?: string;
    height?: string;
    lines?: number;
    className?: string;
}

// ─── Components ──────────────────────────────────────────────

/**
 * Flexible card with optional image, header, footer.
 */
export function gaoCard(config: CardConfig): string {
    const { title, subtitle, body, header, footer, image, variant = 'default', className = '' } = config;
    const variantClass = variant !== 'default' ? ` gao-card-${variant}` : '';
    const cls = `gao-card${variantClass} ${className}`.trim();

    const imageHtml = image ? `<img class="gao-card-image" src="${image.src}" alt="${image.alt}" loading="lazy">` : '';
    const headerHtml = header ? `<div class="gao-card-header">${header}</div>` : '';
    const titleHtml = title ? `<h3 class="gao-card-title">${title}</h3>` : '';
    const subtitleHtml = subtitle ? `<p class="gao-card-subtitle">${subtitle}</p>` : '';
    const footerHtml = footer ? `<div class="gao-card-footer">${footer}</div>` : '';

    return `<article class="${cls}">
${imageHtml}${headerHtml}<div class="gao-card-body">${titleHtml}${subtitleHtml}${body}</div>${footerHtml}
</article>`;
}

/**
 * Collapsible accordion using native <details>/<summary>.
 */
export function gaoAccordion(config: AccordionConfig): string {
    const { items, className = '' } = config;
    const cls = `gao-accordion ${className}`.trim();

    const itemsHtml = items.map(item => {
        const openAttr = item.open ? ' open' : '';
        return `<details${openAttr}>
<summary>${item.title}</summary>
<div class="gao-accordion-content">${item.content}</div>
</details>`;
    }).join('\n');

    return `<div class="${cls}">\n${itemsHtml}\n</div>`;
}

/**
 * Styled list group with optional icons and badges.
 */
export function gaoListGroup(config: ListGroupConfig): string {
    const { items, variant = 'default', className = '' } = config;
    const variantClass = variant === 'flush' ? ' gao-list-group-flush' : '';
    const cls = `gao-list-group${variantClass} ${className}`.trim();

    const itemsHtml = items.map(item => {
        const tag = item.href ? 'a' : 'div';
        const hrefAttr = item.href ? ` href="${item.href}"` : '';
        const activeClass = item.active ? ' gao-list-group-item-active' : '';
        const iconHtml = item.icon ? `<span aria-hidden="true"></span>` : '';
        const badgeHtml = item.badge ? `<span class="gao-badge gao-badge-primary gao-list-group-item-badge">${item.badge}</span>` : '';
        return `<${tag} class="gao-list-group-item${activeClass}"${hrefAttr}>${iconHtml}${item.label}${badgeHtml}</${tag}>`;
    }).join('\n');

    return `<div class="${cls}" role="list">\n${itemsHtml}\n</div>`;
}

/**
 * Loading skeleton placeholder.
 */
export function gaoSkeleton(config: SkeletonConfig = {}): string {
    const { type = 'text', width, height, lines = 3, className = '' } = config;

    const style = [
        width ? `width: ${width}` : '',
        height ? `height: ${height}` : '',
    ].filter(Boolean).join('; ');
    const styleAttr = style ? ` style="${style}"` : '';

    if (type === 'text') {
        const lineHtml = Array.from({ length: lines }, () =>
            `<div class="gao-skeleton gao-skeleton-text"${styleAttr}></div>`
        ).join('\n');
        return `<div class="${className}" aria-busy="true" aria-label="Loading">\n${lineHtml}\n</div>`;
    }

    if (type === 'circle') {
        const size = width ?? '48px';
        return `<div class="gao-skeleton gao-skeleton-circle ${className}" style="width: ${size}; height: ${size}" aria-busy="true"></div>`;
    }

    if (type === 'card') {
        return `<div class="gao-skeleton gao-skeleton-card ${className}"${styleAttr} aria-busy="true"></div>`;
    }

    // rect
    return `<div class="gao-skeleton ${className}"${styleAttr} aria-busy="true"></div>`;
}
