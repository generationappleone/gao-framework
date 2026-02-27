/**
 * @gao/ui — Plugin for @gao/view Integration
 *
 * Registers GaoType fonts, GaoIcons, and Admin components
 * as view helpers available inside .gao templates.
 *
 * Usage:
 * ```typescript
 * import { gaoUIPlugin } from '@gao/ui';
 * app.register(gaoUIPlugin({ fonts: true, icons: true, admin: true }));
 * ```
 */

import { gaoIcon, gaoIconSprite, gaoIconAnimationCSS } from './icons/icon-registry.js';
import { injectFonts, generateFontCSS } from './fonts/font-registry.js';
import { injectAdminCSS } from './admin/admin-styles.js';
import { injectAdminScripts } from './admin/admin-scripts.js';
import { createAdminTemplate } from './admin/admin-template.js';
import {
    statCard, dataTable, barChart, lineChart, donutChart,
    form, breadcrumb, toast, modal, badge, progress, avatar,
    emptyState, alertBanner,
} from './admin/admin-components.js';
import type { GaoFontName } from './fonts/font-registry.js';
import type { GaoIconName, GaoIconOptions } from './icons/icon-types.js';

// ─── Plugin Configuration ────────────────────────────────────

export interface GaoUIPluginOptions {
    /** Enable font helpers. Default: true */
    fonts?: boolean;
    /** Enable icon helpers. Default: true */
    icons?: boolean;
    /** Enable admin template & component helpers. Default: true */
    admin?: boolean;
    /** Default fonts to inject when `injectFonts()` is called without args */
    defaultFonts?: GaoFontName[];
}

// ─── Plugin UI Helpers ───────────────────────────────────────

/**
 * Creates the UI helper object that gets merged into view helpers.
 * These are the functions available inside .gao templates when
 * the plugin is registered.
 */
export function createUIHelpers(options: GaoUIPluginOptions = {}): Record<string, Function> {
    const { fonts = true, icons = true, admin = true, defaultFonts } = options;
    const helpers: Record<string, Function> = {};

    if (fonts) {
        helpers['injectFonts'] = (names?: GaoFontName[]) => injectFonts(names ?? defaultFonts);
        helpers['fontCSS'] = (names?: GaoFontName[]) => generateFontCSS(names ?? defaultFonts);
    }

    if (icons) {
        helpers['gaoIcon'] = (name: GaoIconName, opts?: GaoIconOptions) => gaoIcon(name, opts);
        helpers['gaoIconSprite'] = (names: GaoIconName[]) => gaoIconSprite(names);
        helpers['gaoIconAnimationCSS'] = () => gaoIconAnimationCSS();
    }

    if (admin) {
        helpers['adminCSS'] = () => injectAdminCSS();
        helpers['adminScripts'] = () => injectAdminScripts();
        helpers['statCard'] = statCard;
        helpers['dataTable'] = dataTable;
        helpers['barChart'] = barChart;
        helpers['lineChart'] = lineChart;
        helpers['donutChart'] = donutChart;
        helpers['form'] = form;
        helpers['breadcrumb'] = breadcrumb;
        helpers['toast'] = toast;
        helpers['modal'] = modal;
        helpers['badge'] = badge;
        helpers['progress'] = progress;
        helpers['avatar'] = avatar;
        helpers['emptyState'] = emptyState;
        helpers['alertBanner'] = alertBanner;
        helpers['adminLayout'] = createAdminTemplate.layout.bind(createAdminTemplate);
        helpers['adminSidebar'] = createAdminTemplate.sidebar.bind(createAdminTemplate);
        helpers['adminNavbar'] = createAdminTemplate.navbar.bind(createAdminTemplate);
    }

    return helpers;
}

/**
 * GAO UI Plugin factory.
 *
 * Returns a plugin descriptor compatible with GAO Framework's plugin system.
 * Registers UI helpers into the DI container and view engine.
 *
 * @example
 * ```typescript
 * // Full activation (default)
 * app.register(gaoUIPlugin());
 *
 * // Fonts + icons only (no admin)
 * app.register(gaoUIPlugin({ admin: false }));
 *
 * // Custom default fonts
 * app.register(gaoUIPlugin({ defaultFonts: ['GaoSans', 'GaoMono'] }));
 * ```
 */
export function gaoUIPlugin(options: GaoUIPluginOptions = {}) {
    return {
        name: '@gao/ui',
        version: '0.1.0',

        /**
         * Called when the plugin is registered in the container.
         */
        onRegister(container: any): void {
            const helpers = createUIHelpers(options);
            container.singleton('ui.helpers', () => helpers);
        },

        /**
         * Called after all plugins are registered.
         * Extends the view engine helpers if @gao/view is available.
         */
        onBoot(container: any): void {
            try {
                const helpers = container.resolve('ui.helpers');
                // If view engine is registered, extend its helpers
                if (container.has && container.has('view.engine')) {
                    const engine = container.resolve('view.engine');
                    if (engine && typeof engine.addHelpers === 'function') {
                        engine.addHelpers(helpers);
                    }
                }
            } catch {
                // View engine not available — graceful degradation
            }
        },
    };
}
