import { describe, it, expect } from 'vitest';
import { GaoViewEngine } from '../src/engine.js';
import { ViewHelpers } from '../src/helpers.js';

describe('View Helpers', () => {
    const helpers = new ViewHelpers({
        baseUrl: 'https://gao.framework',
        csrfToken: 'secret-token',
        userPermissions: ['edit_post']
    });
    const engine = new GaoViewEngine({ viewsPath: '.', helpers });

    it('should support url() helper', () => {
        const template = '!{ url("/login") }';
        expect(engine.renderString(template)).toBe('https://gao.framework/login');
    });

    it('should support csrf() helper', () => {
        const template = '!{ csrf() }';
        expect(engine.renderString(template)).toBe('<input type="hidden" name="_csrf" value="secret-token">');
    });

    it('should support can() helper', () => {
        const template = '<@ if (can("edit_post")) { @>Can Edit<@ } @>';
        expect(engine.renderString(template)).toBe('Can Edit');

        const template2 = '<@ if (can("delete_post")) { @>Can Delete<@ } @>';
        expect(engine.renderString(template2)).toBe('');
    });

    it('should support old() helper', () => {
        const template = 'Value: ${ old("name", "Default") }';
        expect(engine.renderString(template, { name: 'John' })).toBe('Value: John');
        expect(engine.renderString(template, {})).toBe('Value: Default');
    });
});
