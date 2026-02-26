import { describe, it, expect } from 'vitest';
import { GaoViewEngine } from '../src/engine.js';
import { ComponentRegistry, BaseComponent } from '../src/component.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viewsPath = path.join(__dirname, 'views');

class ButtonComponent extends BaseComponent {
    render(props: any, slots: any): string {
        const variant = props.variant || 'default';
        return `<button class="btn btn-${variant}">${slots.default}</button>`;
    }
}

describe('Component System', () => {
    const registry = new ComponentRegistry();
    registry.register('Button', ButtonComponent);

    const engine = new GaoViewEngine({ viewsPath, components: registry });

    it('should render a simple component with props and slots', () => {
        const template = `
<@ component('Button', { variant: 'primary' }) @>
    Click Me
<@ endcomponent() @>`.trim();

        const result = engine.renderString(template);
        expect(result).toBe('<button class="btn btn-primary">\n    Click Me\n</button>');
    });

    it('should throw error if component not found', () => {
        const template = "<@ component('NonExistent') @><@ endcomponent() @>";
        expect(() => engine.renderString(template)).toThrow('Component not found: NonExistent');
    });

    it('should support function-based components', () => {
        const Alert = (props: any, slots: any) => `<div class="alert">${props.title}: ${slots.default}</div>`;
        registry.register('Alert', { render: Alert });

        const template = "<@ component('Alert', { title: 'Err' }) @>Msg<@ endcomponent() @>";
        expect(engine.renderString(template)).toBe('<div class="alert">Err: Msg</div>');
    });
});
