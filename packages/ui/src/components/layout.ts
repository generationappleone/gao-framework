/**
 * @gao/ui — Layout Components
 *
 * Grid, Container, and Stack layout components.
 *
 * @since 0.6.0
 */

// ─── Types ───────────────────────────────────────────────────

export interface GridConfig {
    /** Number of columns (1-6). Default: auto-responsive. */
    columns?: number | 'auto';
    /** Gap between items. Default: uses design token. */
    gap?: string;
    /** Children HTML strings. */
    children: string[];
    /** Additional CSS class. */
    className?: string;
}

export interface ContainerConfig {
    /** Max-width preset. Default: 'xl'. */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Inner HTML content. */
    children: string;
    /** Additional CSS class. */
    className?: string;
}

export interface StackConfig {
    /** Stack direction. Default: 'vertical'. */
    direction?: 'horizontal' | 'vertical';
    /** Gap between items. */
    gap?: string;
    /** Alignment. */
    align?: 'start' | 'center' | 'end' | 'stretch';
    /** Wrap items. */
    wrap?: boolean;
    /** Children HTML strings. */
    children: string[];
    /** Additional CSS class. */
    className?: string;
}

// ─── Components ──────────────────────────────────────────────

/**
 * Responsive CSS Grid layout.
 */
export function gaoGrid(config: GridConfig): string {
    const { columns = 'auto', gap, children, className = '' } = config;
    const colClass = columns === 'auto' ? 'gao-grid-auto' : `gao-grid-${columns}`;
    const gapStyle = gap ? ` style="gap: ${gap}"` : '';
    const cls = `${colClass} ${className}`.trim();
    return `<div class="${cls}"${gapStyle}>\n${children.join('\n')}\n</div>`;
}

/**
 * Responsive max-width container.
 */
export function gaoContainer(config: ContainerConfig): string {
    const { size = 'xl', children, className = '' } = config;
    const sizeClass = size === 'xl' ? 'gao-container' : `gao-container gao-container-${size}`;
    const cls = `${sizeClass} ${className}`.trim();
    return `<div class="${cls}">\n${children}\n</div>`;
}

/**
 * Flex stack layout (horizontal or vertical).
 */
export function gaoStack(config: StackConfig): string {
    const { direction = 'vertical', gap, align, wrap = false, children, className = '' } = config;
    const styles: string[] = [];
    styles.push('display: flex');
    styles.push(`flex-direction: ${direction === 'horizontal' ? 'row' : 'column'}`);
    if (gap) styles.push(`gap: ${gap}`);
    if (align) {
        const alignMap: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
        styles.push(`align-items: ${alignMap[align] ?? align}`);
    }
    if (wrap) styles.push('flex-wrap: wrap');
    const cls = className ? ` class="${className}"` : '';
    return `<div${cls} style="${styles.join('; ')}">\n${children.join('\n')}\n</div>`;
}
