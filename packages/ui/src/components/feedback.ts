/**
 * @gao/ui — Feedback Components
 *
 * Alert, Tooltip, and Spinner components.
 *
 * @since 0.6.0
 */

// ─── Types ───────────────────────────────────────────────────

export interface AlertConfig {
    /** Alert message content (can include HTML). */
    message: string;
    /** Alert type/severity. Default: 'info'. */
    type?: 'success' | 'warning' | 'danger' | 'info';
    /** Show icon. Default: true. */
    icon?: boolean;
    /** Dismissible with close button. Default: false. */
    dismissible?: boolean;
    /** Bold title above message. */
    title?: string;
    /** Additional CSS class. */
    className?: string;
}

export interface TooltipConfig {
    /** Tooltip text. */
    text: string;
    /** Position. Default: 'top'. */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Inner HTML content (the trigger element). */
    children: string;
}

export interface SpinnerConfig {
    /** Spinner variant. Default: 'ring'. */
    variant?: 'ring' | 'dots' | 'bars' | 'pulse';
    /** Size. Default: 'md'. */
    size?: 'sm' | 'md' | 'lg';
    /** Custom color. */
    color?: string;
    /** Screen reader label. Default: 'Loading'. */
    label?: string;
}

// ─── Components ──────────────────────────────────────────────

/**
 * Dismissible alert box with semantic `role="alert"`.
 */
export function gaoAlert(config: AlertConfig): string {
    const { message, type = 'info', icon = true, dismissible = false, title, className = '' } = config;
    const cls = `gao-alert gao-alert-${type} ${className}`.trim();

    const iconHtml = icon ? `<span class="gao-alert-icon" aria-hidden="true"></span>` : '';
    const titleHtml = title ? `<div class="gao-alert-title">${title}</div>` : '';
    const closeHtml = dismissible
        ? `<button class="gao-alert-close" aria-label="Dismiss" onclick="this.closest('.gao-alert').remove()">✕</button>`
        : '';

    return `<div class="${cls}" role="alert">
${iconHtml}<div class="gao-alert-content">${titleHtml}${message}</div>${closeHtml}
</div>`;
}

/**
 * Pure CSS tooltip that appears on hover/focus.
 */
export function gaoTooltip(config: TooltipConfig): string {
    const { text, position = 'top', children } = config;
    return `<span class="gao-tooltip gao-tooltip-${position}">
${children}
<span class="gao-tooltip-text" role="tooltip">${text}</span>
</span>`;
}

/**
 * Loading spinner with multiple variants.
 */
export function gaoSpinner(config: SpinnerConfig = {}): string {
    const { variant = 'ring', size = 'md', color, label = 'Loading' } = config;
    const colorStyle = color ? ` style="border-top-color: ${color}"` : '';

    if (variant === 'dots') {
        const dotStyle = color ? ` style="background: ${color}"` : '';
        return `<span class="gao-spinner gao-spinner-dots" role="status" aria-label="${label}">
<span class="gao-spinner-dot"${dotStyle}></span>
<span class="gao-spinner-dot"${dotStyle}></span>
<span class="gao-spinner-dot"${dotStyle}></span>
<span class="gao-sr-only">${label}</span>
</span>`;
    }

    return `<span class="gao-spinner gao-spinner-ring gao-spinner-${size}" role="status" aria-label="${label}"${colorStyle}>
<span class="gao-sr-only">${label}</span>
</span>`;
}
