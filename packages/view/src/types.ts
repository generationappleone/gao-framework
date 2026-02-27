/**
 * @gao/view — Types
 */

import { ComponentRegistry } from './component.js';
import { ViewHelpers } from './helpers.js';

export interface EngineOptions {
    viewsPath: string;
    cache?: boolean;
    components?: ComponentRegistry;
    helpers?: ViewHelpers;
    /** Optional UI helpers injected by @gao/ui plugin */
    uiHelpers?: Record<string, Function>;
}

export type RenderData = Record<string, any>;
