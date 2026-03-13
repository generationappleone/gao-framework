/**
 * @gao/ui — Barrel Export
 *
 * Public API surface for @gao/ui v0.6.0
 * Zero external dependencies — all assets embedded inline.
 */

// ─── Design System ───────────────────────────────────────────
export {
    gaoStyles,
    injectStyles,
    designTokensCSS,
    colorTokensCSS,
    spacingTokensCSS,
    radiusTokensCSS,
    shadowTokensCSS,
    zIndexTokensCSS,
    transitionTokensCSS,
    typographyTokensCSS,
    resetCSS,
    typographyCSS,
    utilitiesCSS,
    responsiveCSS,
    type GaoStylesOptions,
} from './styles/index.js';

// ─── Theme Engine ────────────────────────────────────────────
export { generateThemeCSS, injectTheme } from './theme/theme-engine.js';
export { GAO_THEMES, getPresetTheme, getPresetNames } from './theme/theme-presets.js';
export { themeScript, injectThemeScript } from './theme/theme-script.js';
export type { GaoHSLColor, GaoThemeColors, GaoThemeConfig, GaoThemePresetName } from './theme/theme-types.js';

// ─── General UI Components ───────────────────────────────────
export {
    componentCSS,
    gaoGrid, gaoContainer, gaoStack,
    gaoButton, gaoButtonGroup, gaoDropdownMenu,
    gaoInput, gaoSelect, gaoCheckbox, gaoSwitchToggle, gaoFormGroup,
    gaoAlert, gaoTooltip, gaoSpinner,
    gaoCard, gaoAccordion, gaoListGroup, gaoSkeleton,
    gaoNavbar, gaoTabs, gaoPagination,
    gaoCarousel, gaoOffcanvas,
} from './components/index.js';

// ─── Animation Library ───────────────────────────────────────
export {
    getAnimation, getAllAnimationNames, animationCount,
    gaoAnimate, gaoAnimateCSS, injectAnimations, injectScrollReveal,
} from './animations/animation-registry.js';
export type { GaoAnimationName, GaoAnimationConfig } from './animations/animation-types.js';

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
