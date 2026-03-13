/**
 * @gao/ui — Action Components
 *
 * Button, ButtonGroup, and Dropdown components.
 *
 * @since 0.6.0
 */

// ─── Types ───────────────────────────────────────────────────

export interface ButtonConfig {
    /** Button text label. */
    label: string;
    /** Visual variant. Default: 'primary'. */
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    /** Size. Default: 'md'. */
    size?: 'sm' | 'md' | 'lg';
    /** Icon name (from GaoIcons). */
    icon?: string;
    /** Icon position. Default: 'left'. */
    iconPosition?: 'left' | 'right';
    /** Show loading spinner. */
    loading?: boolean;
    /** Disabled state. */
    disabled?: boolean;
    /** HTML button type. Default: 'button'. */
    type?: 'button' | 'submit' | 'reset';
    /** If provided, renders as <a> instead of <button>. */
    href?: string;
    /** HTML id attribute. */
    id?: string;
    /** Additional CSS class. */
    className?: string;
    /** Inline onclick handler. */
    onclick?: string;
}

export interface ButtonGroupConfig {
    /** Button configurations. */
    buttons: ButtonConfig[];
    /** Vertical group. */
    vertical?: boolean;
    /** Additional CSS class. */
    className?: string;
}

export interface DropdownItem {
    /** Item label text. */
    label?: string;
    /** Icon name. */
    icon?: string;
    /** Link URL. */
    href?: string;
    /** Is divider? */
    divider?: boolean;
    /** Active state. */
    active?: boolean;
    /** Inline onclick. */
    onclick?: string;
}

export interface DropdownConfig {
    /** Trigger button config. */
    trigger: ButtonConfig;
    /** Dropdown items. */
    items: DropdownItem[];
    /** Menu alignment. Default: 'left'. */
    align?: 'left' | 'right';
    /** Additional CSS class. */
    className?: string;
}

// ─── Components ──────────────────────────────────────────────

/**
 * Full-featured button component.
 * Renders <button> by default, or <a> if href is provided.
 */
export function gaoButton(config: ButtonConfig): string {
    const {
        label,
        variant = 'primary',
        size = 'md',
        icon,
        iconPosition = 'left',
        loading = false,
        disabled = false,
        type = 'button',
        href,
        id,
        className = '',
        onclick,
    } = config;

    const classes = [
        'gao-btn',
        `gao-btn-${variant}`,
        size !== 'md' ? `gao-btn-${size}` : '',
        loading ? 'gao-btn-loading' : '',
        className,
    ].filter(Boolean).join(' ');

    const attrs: string[] = [];
    if (id) attrs.push(`id="${id}"`);
    if (disabled) attrs.push('disabled aria-disabled="true"');
    if (onclick) attrs.push(`onclick="${onclick}"`);

    // Icon rendering (simplified — just SVG placeholder class)
    const iconHtml = icon ? `<span class="gao-btn-icon-slot" aria-hidden="true"></span>` : '';
    const labelHtml = `<span class="gao-btn-label">${label}</span>`;
    const content = iconPosition === 'right'
        ? `${labelHtml}${iconHtml}`
        : `${iconHtml}${labelHtml}`;

    if (href && !disabled) {
        return `<a href="${href}" class="${classes}" role="button" ${attrs.join(' ')}>${content}</a>`;
    }

    return `<button type="${type}" class="${classes}" ${attrs.join(' ')}>${content}</button>`;
}

/**
 * Group of buttons rendered together.
 */
export function gaoButtonGroup(config: ButtonGroupConfig): string {
    const { buttons, vertical = false, className = '' } = config;
    const cls = ['gao-btn-group', vertical ? 'gao-btn-group-vertical' : '', className].filter(Boolean).join(' ');
    const rendered = buttons.map(b => gaoButton(b)).join('\n');
    return `<div class="${cls}" role="group">\n${rendered}\n</div>`;
}

/**
 * Dropdown menu with trigger button and items.
 */
export function gaoDropdownMenu(config: DropdownConfig): string {
    const { trigger, items, align = 'left', className = '' } = config;

    const triggerHtml = gaoButton({ ...trigger, className: `${trigger.className ?? ''} gao-dropdown-trigger`.trim() });

    const itemsHtml = items.map(item => {
        if (item.divider) {
            return '<div class="gao-dropdown-divider" role="separator"></div>';
        }
        const tag = item.href ? 'a' : 'div';
        const hrefAttr = item.href ? ` href="${item.href}"` : '';
        const activeClass = item.active ? ' gao-dropdown-item-active' : '';
        const onclickAttr = item.onclick ? ` onclick="${item.onclick}"` : '';
        const iconHtml = item.icon ? `<span class="gao-dropdown-item-icon" aria-hidden="true"></span>` : '';
        return `<${tag} class="gao-dropdown-item${activeClass}"${hrefAttr}${onclickAttr} role="menuitem">${iconHtml}${item.label ?? ''}</${tag}>`;
    }).join('\n');

    const menuClass = `gao-dropdown-menu${align === 'right' ? ' gao-dropdown-menu-right' : ''}`;
    const cls = `gao-dropdown ${className}`.trim();

    return `<div class="${cls}">
${triggerHtml}
<div class="${menuClass}" role="menu">
${itemsHtml}
</div>
</div>`;
}
