/**
 * @gao/ui — Components Index
 *
 * Barrel export for all 23 general-purpose UI components.
 *
 * @since 0.6.0
 */

// ─── Styles ──────────────────────────────────────────────────
export { componentCSS } from './component-styles.js';

// ─── Layout ──────────────────────────────────────────────────
export { gaoGrid, gaoContainer, gaoStack } from './layout.js';
export type { GridConfig, ContainerConfig, StackConfig } from './layout.js';

// ─── Actions ─────────────────────────────────────────────────
export { gaoButton, gaoButtonGroup, gaoDropdownMenu } from './actions.js';
export type { ButtonConfig, ButtonGroupConfig, DropdownConfig, DropdownItem } from './actions.js';

// ─── Forms ───────────────────────────────────────────────────
export { gaoInput, gaoSelect, gaoCheckbox, gaoSwitchToggle, gaoFormGroup } from './forms.js';
export type { InputConfig, SelectConfig, SelectOption, CheckboxConfig, SwitchToggleConfig, FormGroupConfig } from './forms.js';

// ─── Feedback ────────────────────────────────────────────────
export { gaoAlert, gaoTooltip, gaoSpinner } from './feedback.js';
export type { AlertConfig, TooltipConfig, SpinnerConfig } from './feedback.js';

// ─── Data Display ────────────────────────────────────────────
export { gaoCard, gaoAccordion, gaoListGroup, gaoSkeleton } from './data-display.js';
export type { CardConfig, AccordionConfig, AccordionItem, ListGroupConfig, ListGroupItem, SkeletonConfig } from './data-display.js';

// ─── Navigation ──────────────────────────────────────────────
export { gaoNavbar, gaoTabs, gaoPagination } from './navigation.js';
export type { NavbarConfig, NavItem, TabsConfig, TabItem, PaginationConfig } from './navigation.js';

// ─── Media ───────────────────────────────────────────────────
export { gaoCarousel, gaoOffcanvas } from './media.js';
export type { CarouselConfig, CarouselSlide, OffcanvasConfig } from './media.js';
