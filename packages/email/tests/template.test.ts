import { describe, expect, it } from 'vitest';
import { compileTemplate } from '../src/template.js';

describe('Template Compiler', () => {
    it('should replace simple variables', () => {
        const result = compileTemplate('<h1>Hello {{name}}</h1>', { name: 'Alice' });
        expect(result).toBe('<h1>Hello Alice</h1>');
    });

    it('should handle multiple variables', () => {
        const result = compileTemplate('{{greeting}}, {{name}}!', {
            greeting: 'Hi',
            name: 'Bob',
        });
        expect(result).toBe('Hi, Bob!');
    });

    it('should escape HTML in variables by default', () => {
        const result = compileTemplate('<p>{{content}}</p>', {
            content: '<script>alert("xss")</script>',
        });
        expect(result).toBe(
            '<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>',
        );
    });

    it('should allow raw/unescaped output with triple braces', () => {
        const result = compileTemplate('<div>{{{html}}}</div>', {
            html: '<strong>bold</strong>',
        });
        expect(result).toBe('<div><strong>bold</strong></div>');
    });

    it('should resolve dot-notation keys', () => {
        const result = compileTemplate('Hello {{user.name}}', {
            user: { name: 'Charlie' },
        });
        expect(result).toBe('Hello Charlie');
    });

    it('should handle missing variables as empty strings', () => {
        const result = compileTemplate('Hello {{name}}', {});
        expect(result).toBe('Hello ');
    });

    it('should handle deeply nested keys', () => {
        const result = compileTemplate('{{a.b.c}}', {
            a: { b: { c: 'deep' } },
        });
        expect(result).toBe('deep');
    });

    it('should handle numeric values', () => {
        const result = compileTemplate('Count: {{count}}', { count: 42 });
        expect(result).toBe('Count: 42');
    });

    it('should handle whitespace in variable names', () => {
        const result = compileTemplate('{{ name }}', { name: 'trimmed' });
        expect(result).toBe('trimmed');
    });
});
