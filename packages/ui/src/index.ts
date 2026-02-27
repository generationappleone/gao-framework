/**
 * @gao/ui — Barrel Export
 *
 * Public API surface for @gao/ui v0.5.0
 * Zero external dependencies — all assets embedded inline.
 */

// ─── Fonts ───────────────────────────────────────────────────
export {
    registerFont,
    getFont,
    getAllFontNames,
    getAllFonts,
    generateFontCSS,
    injectFonts,
    fontCount,
    clearFontRegistry,
} from './fonts/font-registry.js';

export type { GaoFontData, GaoFontName } from './fonts/font-registry.js';

// Import all font modules to trigger self-registration
import './fonts/gao-sans.js';
import './fonts/gao-mono.js';
import './fonts/gao-display.js';
import './fonts/gao-slab.js';
import './fonts/gao-rounded.js';
import './fonts/gao-condensed.js';
import './fonts/gao-script.js';
import './fonts/gao-pixel.js';
import './fonts/gao-handwriting.js';
import './fonts/gao-terminal.js';

// ─── Icons ───────────────────────────────────────────────────
export {
    gaoIcon,
    gaoIconSprite,
    gaoIconAnimationCSS,
    getAllIconNames,
    getIconsByCategory,
    getAllCategories,
    hasIcon,
    iconCount,
    registerIcon,
    registerIconSet,
    clearIconRegistry,
} from './icons/icon-registry.js';

export type { GaoIconName, GaoIconData, GaoIconOptions, GaoIconCategory } from './icons/icon-types.js';

// Import all icon sets to trigger self-registration
import './icons/sets/navigation.js';
import './icons/sets/actions.js';
import './icons/sets/media.js';
import './icons/sets/social.js';
import './icons/sets/data.js';
import './icons/sets/status.js';
import './icons/sets/commerce.js';
import './icons/sets/device.js';
import './icons/sets/nature.js';
import './icons/sets/misc.js';

// ─── Admin ───────────────────────────────────────────────────
export { adminCSS, injectAdminCSS } from './admin/admin-styles.js';
export { adminScripts, injectAdminScripts } from './admin/admin-scripts.js';
export {
    createAdminTemplate,
    type SidebarItem,
    type NavbarConfig,
    type AdminLayoutConfig,
    type DashboardStat,
    type DashboardConfig,
} from './admin/admin-template.js';

export {
    statCard,
    dataTable,
    barChart,
    lineChart,
    donutChart,
    form,
    breadcrumb,
    toast,
    modal,
    badge,
    progress,
    avatar,
    emptyState,
    alertBanner,
    type StatCardConfig,
    type DataTableConfig,
    type DataTableColumn,
    type ChartDataPoint,
    type FormField,
    type ToastConfig,
    type ModalConfig,
    type BadgeConfig,
    type ProgressConfig,
    type AvatarConfig,
    type AlertConfig,
} from './admin/admin-components.js';

// ─── Plugin ──────────────────────────────────────────────────
export { gaoUIPlugin, createUIHelpers, type GaoUIPluginOptions } from './plugin.js';
