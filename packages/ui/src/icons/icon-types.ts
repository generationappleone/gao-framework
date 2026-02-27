/**
 * @gao/ui — Icon Type Definitions
 *
 * TypeScript union type for all 200 icon names,
 * plus option interfaces for rendering.
 */

// ─── Icon Data Interface ─────────────────────────────────────

export interface GaoIconData {
    /** SVG path `d` attribute */
    path: string;
    /** Optional second path for dual-tone accent */
    accentPath?: string;
    /** ViewBox string, default '0 0 24 24' */
    viewBox?: string;
    /** Default stroke width */
    strokeWidth?: number;
}

// ─── Icon Render Options ─────────────────────────────────────

export interface GaoIconOptions {
    /** Icon size in px (width & height). Default: 24 */
    size?: number;
    /** Stroke weight variant. Default: 'regular' */
    weight?: 'light' | 'regular' | 'bold';
    /** Fill/stroke color. Default: 'currentColor' */
    color?: string;
    /** Additional CSS class(es) */
    class?: string;
    /** HTML id attribute */
    id?: string;
    /** Accessibility title (adds <title> element) */
    title?: string;
    /** Infinite rotation animation */
    spin?: boolean;
    /** Pulse animation */
    pulse?: boolean;
}

// ─── Icon Category Type ──────────────────────────────────────

export type GaoIconCategory =
    | 'navigation'
    | 'actions'
    | 'media'
    | 'social'
    | 'data'
    | 'status'
    | 'commerce'
    | 'device'
    | 'nature'
    | 'misc';

// ─── Icon Name Union Type (200 icons) ────────────────────────

export type GaoIconName =
    // Navigation (20)
    | 'home' | 'menu' | 'arrow-up' | 'arrow-down' | 'arrow-left' | 'arrow-right'
    | 'chevron-up' | 'chevron-down' | 'chevron-left' | 'chevron-right'
    | 'external-link' | 'corner-up-right' | 'maximize' | 'minimize'
    | 'move' | 'more-horizontal' | 'more-vertical' | 'sidebar' | 'layout' | 'grid-layout'
    // Actions (20)
    | 'edit' | 'delete' | 'trash' | 'save' | 'copy' | 'paste' | 'cut'
    | 'download' | 'upload' | 'refresh' | 'search' | 'zoom-in' | 'zoom-out'
    | 'plus' | 'minus' | 'check' | 'x' | 'undo' | 'redo' | 'print'
    // Media (20)
    | 'play' | 'pause' | 'stop' | 'skip-forward' | 'skip-back'
    | 'volume' | 'volume-mute' | 'image' | 'video' | 'music'
    | 'camera' | 'mic' | 'mic-off' | 'film' | 'radio'
    | 'headphones' | 'speaker' | 'cast' | 'airplay' | 'tv'
    // Social (20)
    | 'heart' | 'heart-fill' | 'star' | 'star-fill' | 'bookmark'
    | 'share' | 'comment' | 'thumbs-up' | 'thumbs-down' | 'bell'
    | 'bell-off' | 'flag' | 'pin' | 'send' | 'at-sign'
    | 'hash' | 'link' | 'link-off' | 'users' | 'user-plus'
    // Data (20)
    | 'chart-bar' | 'chart-line' | 'chart-pie' | 'chart-area' | 'database'
    | 'filter' | 'sort-asc' | 'sort-desc' | 'layers' | 'list'
    | 'table' | 'columns' | 'rows' | 'inbox' | 'archive'
    | 'folder' | 'folder-open' | 'file' | 'file-text' | 'clipboard'
    // Status (20)
    | 'check-circle' | 'x-circle' | 'alert-triangle' | 'alert-circle' | 'info'
    | 'help-circle' | 'clock' | 'timer' | 'shield' | 'shield-check'
    | 'lock' | 'unlock' | 'eye' | 'eye-off' | 'loader'
    | 'loading-dots' | 'zap' | 'activity' | 'bar-chart-alt' | 'trending-up'
    // Commerce (20)
    | 'cart' | 'cart-plus' | 'wallet' | 'credit-card' | 'receipt'
    | 'tag' | 'percent' | 'gift' | 'truck' | 'store'
    | 'shopping-bag' | 'dollar' | 'euro' | 'coin' | 'bank'
    | 'invoice' | 'barcode' | 'qr-code' | 'package' | 'box'
    // Device (20)
    | 'phone' | 'phone-call' | 'laptop' | 'monitor' | 'tablet'
    | 'printer' | 'keyboard' | 'mouse' | 'wifi' | 'wifi-off'
    | 'bluetooth' | 'battery' | 'plug' | 'power' | 'cpu'
    | 'hard-drive' | 'server' | 'cloud' | 'cloud-upload' | 'cloud-download'
    // Nature (20)
    | 'sun' | 'moon' | 'cloud-sun' | 'rain' | 'snow'
    | 'wind' | 'leaf' | 'tree' | 'flower' | 'flame'
    | 'water' | 'mountain' | 'sunrise' | 'sunset' | 'thermometer'
    | 'umbrella' | 'rainbow' | 'lightning' | 'anchor' | 'wave'
    // Misc (20)
    | 'rocket' | 'magic-wand' | 'crown' | 'diamond' | 'key'
    | 'compass' | 'globe' | 'map' | 'map-pin' | 'navigation'
    | 'code' | 'terminal' | 'git-branch' | 'git-merge' | 'puzzle'
    | 'light-bulb' | 'graduation-cap' | 'trophy' | 'target' | 'crosshair';
