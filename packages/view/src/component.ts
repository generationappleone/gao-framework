/**
 * @gao/view — Component System
 * 
 * Support for reusable UI components in templates.
 */

import type { RenderData } from './types.js';

export interface ComponentMetadata {
    name: string;
    template?: string;
    render?: (props: RenderData, slots: Record<string, string>) => string;
}

export abstract class BaseComponent {
    abstract render(props: RenderData, slots: Record<string, string>): string;
}

export class ComponentRegistry {
    private components = new Map<string, any>();

    public register(name: string, component: any) {
        this.components.set(name, component);
    }

    public get(name: string): any {
        return this.components.get(name);
    }

    public has(name: string): boolean {
        return this.components.has(name);
    }
}
