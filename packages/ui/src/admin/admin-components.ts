/**
 * @gao/ui — Admin Components
 *
 * Pre-built HTML string generators for admin UI components.
 * All components use GaoIcons and the GaoAdmin CSS design system.
 */

import { gaoIcon } from '../icons/icon-registry.js';
import type { GaoIconName } from '../icons/icon-types.js';

// ─── Types ───────────────────────────────────────────────────

export interface StatCardConfig {
    label: string;
    value: string | number;
    icon: GaoIconName;
    trend?: { value: string; direction: 'up' | 'down' };
    iconColor?: string;
    iconBg?: string;
}

export interface DataTableColumn {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
}

export interface DataTableConfig {
    columns: DataTableColumn[];
    rows: Record<string, string | number>[];
    pageInfo?: { current: number; total: number; perPage: number };
}

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface FormField {
    name: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
    placeholder?: string;
    value?: string;
    options?: { label: string; value: string }[];
    required?: boolean;
}

export interface ToastConfig {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    icon?: GaoIconName;
}

export interface ModalConfig {
    id: string;
    title: string;
    body: string;
    footer?: string;
    size?: 'sm' | 'md' | 'lg';
}

export interface BadgeConfig {
    text: string;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    dot?: boolean;
}

export interface ProgressConfig {
    value: number;
    max?: number;
    color?: string;
    showLabel?: boolean;
}

export interface AvatarConfig {
    name: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg';
    status?: boolean;
}

export interface AlertConfig {
    message: string;
    type?: 'success' | 'warning' | 'danger' | 'info';
    icon?: GaoIconName;
}

// ─── Component Generators ────────────────────────────────────

/**
 * Stat card with icon, value, label, and optional trend.
 */
export function statCard(config: StatCardConfig): string {
    const { label, value, icon, trend, iconColor, iconBg } = config;

    const trendHtml = trend
        ? `<div class="gao-admin-stat-trend ${trend.direction}">
         ${gaoIcon(trend.direction === 'up' ? 'trending-up' : 'arrow-down', { size: 14 })}
         ${esc(trend.value)}
       </div>`
        : '';

    const bgStyle = iconBg ? ` style="background:${iconBg}"` : '';
    const colorStyle = iconColor ?? 'var(--gao-primary)';

    return `<div class="gao-admin-stat-card">
  <div>
    <div class="gao-admin-stat-value">${esc(String(value))}</div>
    <div class="gao-admin-stat-label">${esc(label)}</div>
    ${trendHtml}
  </div>
  <div class="gao-admin-stat-icon"${bgStyle}>
    ${gaoIcon(icon, { size: 24, color: colorStyle })}
  </div>
</div>`;
}

/**
 * Data table with columns, rows, and optional pagination.
 */
export function dataTable(config: DataTableConfig): string {
    const { columns, rows, pageInfo } = config;

    const thead = columns
        .map(c => `<th style="text-align:${c.align ?? 'left'}">${esc(c.label)}</th>`)
        .join('');

    const tbody = rows
        .map(row => {
            const cells = columns
                .map(c => `<td style="text-align:${c.align ?? 'left'}">${esc(String(row[c.key] ?? ''))}</td>`)
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('\n');

    const paginationHtml = pageInfo
        ? `<div class="gao-admin-table-pagination">
         <span>Showing ${(pageInfo.current - 1) * pageInfo.perPage + 1}–${Math.min(pageInfo.current * pageInfo.perPage, pageInfo.total)} of ${pageInfo.total}</span>
         <div class="gao-admin-flex gao-admin-gap-2">
           <button class="gao-admin-btn gao-admin-btn-sm gao-admin-btn-secondary"${pageInfo.current <= 1 ? ' disabled' : ''}>Previous</button>
           <button class="gao-admin-btn gao-admin-btn-sm gao-admin-btn-secondary"${pageInfo.current * pageInfo.perPage >= pageInfo.total ? ' disabled' : ''}>Next</button>
         </div>
       </div>`
        : '';

    return `<div class="gao-admin-table-wrapper">
  <table class="gao-admin-table">
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
  ${paginationHtml}
</div>`;
}

/**
 * Bar chart using SVG rectangles.
 */
export function barChart(data: ChartDataPoint[], height = 200): string {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.floor(80 / data.length);
    const gap = 2;

    const bars = data.map((d, i) => {
        const barH = (d.value / maxVal) * (height - 40);
        const x = 10 + i * (barWidth + gap);
        const y = height - 30 - barH;
        const color = d.color ?? 'var(--gao-primary)';
        return `<rect x="${x}%" y="${y}" width="${barWidth - 1}%" height="${barH}" rx="3" fill="${color}" opacity="0.85">
      <title>${esc(d.label)}: ${d.value}</title>
    </rect>
    <text x="${x + barWidth / 2}%" y="${height - 12}" text-anchor="middle" font-size="10" fill="var(--gao-text-muted)">${esc(d.label)}</text>`;
    }).join('\n');

    return `<svg viewBox="0 0 100% ${height}" width="100%" height="${height}" class="gao-admin-chart-bar">
  ${bars}
</svg>`;
}

/**
 * Line chart using SVG polyline.
 */
export function lineChart(data: ChartDataPoint[], height = 200): string {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const w = 100;
    const stepX = (w - 10) / Math.max(data.length - 1, 1);

    const points = data.map((d, i) => {
        const x = 5 + i * stepX;
        const y = height - 30 - (d.value / maxVal) * (height - 50);
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${5},${height - 30} ${points} ${5 + (data.length - 1) * stepX},${height - 30}`;
    const color = data[0]?.color ?? 'var(--gao-primary)';

    const labels = data.map((d, i) => {
        const x = 5 + i * stepX;
        return `<text x="${x}" y="${height - 12}" text-anchor="middle" font-size="10" fill="var(--gao-text-muted)">${esc(d.label)}</text>`;
    }).join('\n');

    return `<svg viewBox="0 0 ${w} ${height}" width="100%" height="${height}" class="gao-admin-chart-line" preserveAspectRatio="none">
  <polygon points="${areaPoints}" fill="${color}" opacity="0.08"/>
  <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  ${labels}
</svg>`;
}

/**
 * Donut chart using SVG circle arcs.
 */
export function donutChart(data: ChartDataPoint[], size = 180): string {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.35;
    const circumference = 2 * Math.PI * r;

    let offset = 0;
    const defaultColors = ['var(--gao-primary)', 'var(--gao-accent)', 'var(--gao-success)', 'var(--gao-warning)', 'var(--gao-danger)', 'var(--gao-info)'];

    const segments = data.map((d, i) => {
        const pct = d.value / total;
        const dash = circumference * pct;
        const color = d.color ?? defaultColors[i % defaultColors.length];
        const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${size * 0.12}" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
        offset += dash;
        return seg;
    }).join('\n');

    const legend = data.map((d, i) => {
        const color = d.color ?? defaultColors[i % defaultColors.length];
        return `<div style="display:flex;align-items:center;gap:6px;font-size:12px"><span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></span>${esc(d.label)} (${d.value})</div>`;
    }).join('');

    return `<div style="display:flex;align-items:center;gap:var(--gao-space-6)">
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="gao-admin-chart-donut">
    ${segments}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.65}" fill="var(--gao-surface)"/>
  </svg>
  <div style="display:flex;flex-direction:column;gap:4px">${legend}</div>
</div>`;
}

/**
 * Form builder from field config.
 */
export function form(fields: FormField[], action?: string): string {
    const inputs = fields.map(f => {
        const required = f.required ? ' required' : '';
        const id = `field-${f.name}`;

        let input: string;
        if (f.type === 'textarea') {
            input = `<textarea id="${id}" name="${f.name}" class="gao-admin-input" placeholder="${esc(f.placeholder ?? '')}" rows="4"${required}>${esc(f.value ?? '')}</textarea>`;
        } else if (f.type === 'select' && f.options) {
            const opts = f.options.map(o => `<option value="${esc(o.value)}"${o.value === f.value ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
            input = `<select id="${id}" name="${f.name}" class="gao-admin-input gao-admin-select"${required}>${opts}</select>`;
        } else {
            input = `<input id="${id}" name="${f.name}" type="${f.type ?? 'text'}" class="gao-admin-input" placeholder="${esc(f.placeholder ?? '')}" value="${esc(f.value ?? '')}"${required} />`;
        }

        return `<div class="gao-admin-form-group">
      <label for="${id}" class="gao-admin-label">${esc(f.label)}</label>
      ${input}
    </div>`;
    }).join('\n');

    return `<form${action ? ` action="${esc(action)}"` : ''} method="POST">\n${inputs}\n</form>`;
}

/**
 * Breadcrumb navigation.
 */
export function breadcrumb(items: { label: string; href?: string }[]): string {
    const parts = items.map((item, i) => {
        const sep = i < items.length - 1 ? `<span class="gao-admin-breadcrumb-separator">/</span>` : '';
        const el = item.href
            ? `<a href="${esc(item.href)}">${esc(item.label)}</a>`
            : `<span>${esc(item.label)}</span>`;
        return el + sep;
    }).join('');

    return `<nav class="gao-admin-breadcrumb">${parts}</nav>`;
}

/**
 * Toast notification HTML.
 */
export function toast(config: ToastConfig): string {
    const { message, type = 'info' } = config;
    const icons: Record<string, GaoIconName> = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    const icon = config.icon ?? icons[type] ?? 'info';

    return `<div class="gao-admin-toast gao-admin-toast-${type}">
  ${gaoIcon(icon, { size: 20 })}
  <span>${esc(message)}</span>
  <button class="gao-admin-toast-close">&times;</button>
</div>`;
}

/**
 * Modal dialog.
 */
export function modal(config: ModalConfig): string {
    const { id, title, body, footer, size = 'md' } = config;
    const maxWidth = size === 'sm' ? '400px' : size === 'lg' ? '720px' : '520px';

    const footerHtml = footer
        ? `<div class="gao-admin-modal-footer">${footer}</div>`
        : `<div class="gao-admin-modal-footer">
         <button class="gao-admin-btn gao-admin-btn-secondary" data-modal-close>Cancel</button>
         <button class="gao-admin-btn gao-admin-btn-primary">Confirm</button>
       </div>`;

    return `<div id="${esc(id)}" class="gao-admin-modal-overlay" style="display:none">
  <div class="gao-admin-modal" style="max-width:${maxWidth}">
    <div class="gao-admin-modal-header">
      <h3>${esc(title)}</h3>
      <button class="gao-admin-btn gao-admin-btn-ghost gao-admin-btn-icon" data-modal-close>${gaoIcon('x', { size: 18 })}</button>
    </div>
    <div class="gao-admin-modal-body">${body}</div>
    ${footerHtml}
  </div>
</div>`;
}

/**
 * Badge component.
 */
export function badge(config: BadgeConfig): string {
    const { text, variant = 'primary', dot = false } = config;
    const dotClass = dot ? ' gao-admin-badge-dot' : '';
    return `<span class="gao-admin-badge gao-admin-badge-${variant}${dotClass}">${esc(text)}</span>`;
}

/**
 * Progress bar.
 */
export function progress(config: ProgressConfig): string {
    const { value, max = 100, color, showLabel = false } = config;
    const pct = Math.min(Math.max((value / max) * 100, 0), 100);
    const style = color ? ` style="background:${color}"` : '';
    const label = showLabel ? `<div class="gao-admin-small" style="margin-top:var(--gao-space-1)">${Math.round(pct)}%</div>` : '';

    return `<div>
  <div class="gao-admin-progress">
    <div class="gao-admin-progress-fill"${style} style="width:${pct}%"></div>
  </div>
  ${label}
</div>`;
}

/**
 * Avatar with fallback initials.
 */
export function avatar(config: AvatarConfig): string {
    const { name, src, size = 'md', status = false } = config;
    const statusClass = status ? ' gao-admin-avatar-status' : '';
    const content = src
        ? `<img src="${esc(src)}" alt="${esc(name)}" />`
        : getInitials(name);

    return `<div class="gao-admin-avatar gao-admin-avatar-${size}${statusClass}" title="${esc(name)}">${content}</div>`;
}

/**
 * Empty state placeholder.
 */
export function emptyState(title: string, description?: string, icon: GaoIconName = 'inbox'): string {
    return `<div class="gao-admin-empty">
  ${gaoIcon(icon, { size: 48 })}
  <div class="gao-admin-empty-title">${esc(title)}</div>
  ${description ? `<p>${esc(description)}</p>` : ''}
</div>`;
}

/**
 * Alert banner.
 */
export function alertBanner(config: AlertConfig): string {
    const { message, type = 'info' } = config;
    const icons: Record<string, GaoIconName> = { success: 'check-circle', warning: 'alert-triangle', danger: 'x-circle', info: 'info' };
    const icon = config.icon ?? icons[type] ?? 'info';

    return `<div class="gao-admin-alert gao-admin-alert-${type}">
  ${gaoIcon(icon, { size: 20 })}
  <span>${esc(message)}</span>
</div>`;
}

// ─── Utilities ───────────────────────────────────────────────

function esc(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getInitials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}
