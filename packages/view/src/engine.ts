/**
 * @gao/view — Template Engine
 * 
 * Type-safe, high-performance template engine using compiled JS functions.
 * Supports auto-escaping, sections, layouts, and partials.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ComponentRegistry } from './component.js';
import { ViewHelpers } from './helpers.js';
import type { EngineOptions, RenderData } from './types.js';

export class GaoViewEngine {
    private fileCache = new Map<string, (data: RenderData, helpers: any) => string>();
    private sections: Record<string, string> = {};
    private currentLayout: string | null = null;
    private components: ComponentRegistry;
    private helpers: ViewHelpers;
    private uiHelpers: Record<string, Function> = {};

    constructor(private options: EngineOptions) {
        this.components = options.components || new ComponentRegistry();
        this.helpers = options.helpers || new ViewHelpers();
        if (options.uiHelpers) {
            this.uiHelpers = { ...options.uiHelpers };
        }
    }

    /**
     * Add UI helpers at runtime (called by plugins like @gao/ui).
     */
    public addHelpers(helpers: Record<string, Function>): void {
        Object.assign(this.uiHelpers, helpers);
    }

    /**
     * Escape HTML to prevent XSS.
     */
    private escape(str: any): string {
        if (str === null || str === undefined) return '';
        const s = String(str);
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Render a template string with data.
     */
    public renderString(template: string, data: RenderData = {}): string {
        const fn = this.compile(template);
        const helpers = this.createHelpers(() => {
            throw new Error('Partial/Layout rendering not supported in renderString');
        }, data);
        return fn(data, helpers);
    }

    /**
     * Compile a template string into a render function.
     */
    /**
     * Preprocess control flow directives before tokenization.
     * Converts @if/@foreach/etc. into <@ code @> blocks.
     */
    private preprocessDirectives(template: string): string {
        let result = template;

        // Helper: extract balanced parenthesized content after @directive
        // e.g. @if(foo === "bar") → captures 'foo === "bar"'
        const replaceDirective = (
            input: string,
            directive: string,
            replacement: (content: string) => string,
        ): string => {
            let output = '';
            let i = 0;
            const tag = `@${directive}`;
            while (i < input.length) {
                const idx = input.indexOf(tag, i);
                if (idx === -1) {
                    output += input.slice(i);
                    break;
                }
                output += input.slice(i, idx);
                let j = idx + tag.length;
                // Skip optional whitespace
                while (j < input.length && (input[j] === ' ' || input[j] === '\t')) j++;
                if (input[j] === '(') {
                    // Find balanced close paren
                    let depth = 1;
                    let start = j + 1;
                    j++;
                    while (j < input.length && depth > 0) {
                        if (input[j] === '(') depth++;
                        else if (input[j] === ')') depth--;
                        j++;
                    }
                    const content = input.slice(start, j - 1);
                    output += replacement(content);
                    i = j;
                } else {
                    output += tag;
                    i = idx + tag.length;
                }
            }
            return output;
        };

        // @if(condition) → <@ if (condition) { @>
        result = replaceDirective(result, 'if', (c) => `<@ if (${c}) { @>`);
        // @elseif(condition) → <@ } else if (condition) { @>
        result = replaceDirective(result, 'elseif', (c) => `<@ } else if (${c}) { @>`);
        // @else → <@ } else { @>
        result = result.replace(/@else(?!if)\b\s*/g, '<@ } else { @>');
        // @endif → <@ } @>
        result = result.replace(/@endif\b\s*/g, '<@ } @>');

        // @unless(condition) → <@ if (!(condition)) { @>
        result = replaceDirective(result, 'unless', (c) => `<@ if (!(${c})) { @>`);
        // @endunless → <@ } @>
        result = result.replace(/@endunless\b\s*/g, '<@ } @>');

        // @foreach(items as item, index) or @foreach(items as item)
        result = replaceDirective(result, 'foreach', (c) => {
            const matchWithIndex = c.match(/^(.+?)\s+as\s+(\w+)\s*,\s*(\w+)$/);
            if (matchWithIndex) {
                return `<@ for (const [${matchWithIndex[3]}, ${matchWithIndex[2]}] of (${matchWithIndex[1]}).entries()) { @>`;
            }
            const matchSimple = c.match(/^(.+?)\s+as\s+(\w+)$/);
            if (matchSimple) {
                return `<@ for (const ${matchSimple[2]} of (${matchSimple[1]})) { @>`;
            }
            return `<@ /* invalid foreach: ${c} */ @>`;
        });
        // @endforeach → <@ } @>
        result = result.replace(/@endforeach\b\s*/g, '<@ } @>');

        // @empty(array)
        result = replaceDirective(result, 'empty', (c) =>
            `<@ if (Array.isArray(${c}) && (${c}).length === 0) { @>`);
        result = result.replace(/@endempty\b\s*/g, '<@ } @>');

        // @switch(expr)
        result = replaceDirective(result, 'switch', (c) => `<@ switch (${c}) { @>`);
        // @case(val)
        result = replaceDirective(result, 'case', (c) => `<@ case ${c}: @>`);
        // @default → <@ default: @>
        result = result.replace(/@default\b\s*/g, '<@ default: @>');
        // @break → <@ break; @>
        result = result.replace(/@break\b\s*/g, '<@ break; @>');
        // @endswitch → <@ } @>
        result = result.replace(/@endswitch\b\s*/g, '<@ } @>');

        // @json(data)
        result = replaceDirective(result, 'json', (c) =>
            `<@ __target(__escape(JSON.stringify(${c}))); @>`);

        // @class({ 'active': condition, 'disabled': otherCondition })
        result = replaceDirective(result, 'class', (c) =>
            `<@ __target(Object.entries(${c}).filter(([,v]) => v).map(([k]) => k).join(' ')); @>`);

        // ─── @gao/ui directives (active when gaoUIPlugin is registered) ───

        // @fonts(['GaoSans', 'GaoMono']) → injects font CSS
        result = replaceDirective(result, 'fonts', (c) =>
            `<@ if (typeof injectFonts === 'function') __target(injectFonts(${c})); @>`);

        // @icon('home', { size: 20 }) → renders SVG icon
        result = replaceDirective(result, 'icon', (c) =>
            `<@ if (typeof gaoIcon === 'function') __target(gaoIcon(${c})); @>`);

        // @adminLayout({ sidebar: [...] }) → full admin page layout
        result = replaceDirective(result, 'adminLayout', (c) =>
            `<@ if (typeof adminLayout === 'function') __target(adminLayout(${c})); @>`);

        return result;
    }

    public compile(template: string, filename?: string): (data: RenderData, helpers: any) => string {
        // Phase 1: Preprocess control flow directives
        const preprocessed = this.preprocessDirectives(template);

        let code = 'let __out = "";\n';
        // Destructure core helpers and standard helpers
        code += 'const { __escape, layout, section, endsection, partial, yieldSection, component, endcomponent, url, asset, csrf, can, old, paginate, ...uiH } = __helpers;\n';
        // Spread UI helpers into scope (gaoIcon, injectFonts, statCard, etc.)
        code += 'const { injectFonts, gaoIcon, adminLayout, adminCSS, adminScripts, statCard, dataTable, barChart, lineChart, donutChart, toast, modal, badge, progress, avatar, fontCSS, gaoIconSprite, gaoIconAnimationCSS, emptyState, alertBanner, breadcrumb, form, adminSidebar, adminNavbar } = uiH;\n';
        code += 'let __target = (text) => { __out += text; };\n';

        const tokens = preprocessed.split(/(<@[\s\S]*?@>|\$\{[\s\S]*?\}|\!\{[\s\S]*?\})/);

        for (const token of tokens) {
            if (!token) continue;

            if (token.startsWith('<@') && token.endsWith('@>')) {
                const js = token.slice(2, -2).trim();
                if (js.startsWith('section(')) {
                    code += `__helpers.section(${js.slice(8, -1)});\n`;
                    code += '__target = (text) => { __helpers.__write(text); };\n';
                } else if (js === 'endsection()') {
                    code += '__helpers.endsection();\n';
                    code += '__target = (text) => { __out += text; };\n';
                } else if (js.startsWith('component(')) {
                    code += `__helpers.component(${js.slice(10, -1)});\n`;
                    code += '__target = (text) => { __helpers.__writeComponent(text); };\n';
                } else if (js === 'endcomponent()') {
                    code += '__target = (text) => { __out += text; };\n';
                    code += '__out += __helpers.endcomponent();\n';
                } else if (js.startsWith('yieldSection(') || js.startsWith('partial(') ||
                    js.startsWith('url(') || js.startsWith('asset(') ||
                    js.startsWith('csrf(') || js.startsWith('can(') ||
                    js.startsWith('old(') || js.startsWith('paginate(')) {
                    code += `__target(${js});\n`;
                } else {
                    code += `${js}\n`;
                }
            } else if (token.startsWith('${') && token.endsWith('}')) {
                const exp = token.slice(2, -1).trim();
                code += `__target(__escape(${exp}));\n`;
            } else if (token.startsWith('!{') && token.endsWith('}')) {
                const exp = token.slice(2, -1).trim();
                code += `__target(${exp});\n`;
            } else {
                code += `__target(${JSON.stringify(token)});\n`;
            }
        }

        code += 'return __out;';

        try {
            return new Function('data', '__helpers', `
        with(data) {
          ${code}
        }
      `) as (data: RenderData, helpers: any) => string;
        } catch (e: any) {
            const location = filename ? ` in ${filename}` : '';
            throw new Error(`Template compilation error${location}: ${e.message}\nCode:\n${code}`);
        }
    }

    public async render(viewName: string, data: RenderData = {}): Promise<string> {
        this.sections = {};
        this.currentLayout = null;
        return await this.renderInternal(viewName, data);
    }

    private async renderInternal(viewName: string, data: RenderData): Promise<string> {
        const execute = (name: string, d: any): string => {
            const filePath = this.resolvePath(name);
            let fn = this.fileCache.get(filePath);
            if (!fn || !this.options.cache) {
                const template = fs.readFileSync(filePath, 'utf8');
                fn = this.compile(template, filePath);
                if (this.options.cache) this.fileCache.set(filePath, fn);
            }
            const helpers = this.createHelpers(execute, d);
            return fn(d, helpers);
        };

        const content = execute(viewName, data);

        if (this.currentLayout) {
            const layoutName = this.currentLayout;
            this.currentLayout = null;
            if (!this.sections.content) this.sections.content = content;
            return await this.renderInternal(layoutName, data);
        }

        return content;
    }

    private createHelpers(execute: Function, data: any) {
        let currentSectionName: string | null = null;
        let sectionBuffer = '';
        let currentComponentName: string | null = null;
        let currentComponentProps: any = null;
        let componentBuffer = '';

        return {
            __escape: this.escape.bind(this),
            layout: (name: string) => { this.currentLayout = name; return ''; },
            section: (name: string) => {
                currentSectionName = name;
                sectionBuffer = '';
                return '';
            },
            endsection: () => {
                if (currentSectionName) {
                    this.sections[currentSectionName] = sectionBuffer;
                    currentSectionName = null;
                }
                return '';
            },
            partial: (name: string, pData: any) => execute(name, { ...data, ...pData }),
            yieldSection: (name: string) => this.sections[name] || '',
            component: (name: string, props: any = {}) => {
                currentComponentName = name;
                currentComponentProps = props;
                componentBuffer = '';
                return '';
            },
            endcomponent: () => {
                if (!currentComponentName) return '';
                const name = currentComponentName;
                const props = currentComponentProps;
                const slots = { default: componentBuffer };
                currentComponentName = null;
                currentComponentProps = null;
                componentBuffer = '';
                const comp = this.components.get(name);
                if (!comp) throw new Error(`Component not found: ${name}`);
                if (comp.render) return comp.render(props, slots);
                if (comp.prototype && comp.prototype.render) return new comp().render(props, slots);
                return '';
            },
            __write: (text: string) => { if (currentSectionName) sectionBuffer += text; },
            __writeComponent: (text: string) => { if (currentComponentName) componentBuffer += text; },

            // Inject global helpers
            url: (path: string) => this.helpers.url(path),
            asset: (path: string) => this.helpers.asset(path),
            csrf: () => this.helpers.csrf(),
            can: (p: string) => this.helpers.can(p),
            old: (key: string, def?: any) => this.helpers.old(key, data, def),
            paginate: (meta: any) => this.helpers.paginate(meta),

            // Spread UI helpers from @gao/ui plugin (if registered)
            ...this.uiHelpers,
        };
    }

    private resolvePath(viewName: string): string {
        const name = viewName.endsWith('.gao') ? viewName : `${viewName}.gao`;
        const fullPath = path.resolve(this.options.viewsPath, name);
        if (!fs.existsSync(fullPath)) throw new Error(`View not found: ${fullPath}`);
        return fullPath;
    }
}
