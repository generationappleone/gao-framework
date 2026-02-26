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
}

export type RenderData = Record<string, any>;
