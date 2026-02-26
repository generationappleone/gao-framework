/**
 * @gao/email — Template Compiler
 *
 * Compiles email templates with data interpolation.
 * Auto-escapes HTML in variables to prevent injection.
 * Follows SRP: only handles template rendering.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

/**
 * Escape HTML special characters to prevent injection.
 */
function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Compile a template string with variable substitution.
 * Variables use `{{key}}` syntax. Nested keys use dot notation: `{{user.name}}`.
 * All values are HTML-escaped by default.
 * Use `{{{key}}}` (triple braces) for raw/unescaped output.
 *
 * @example
 * ```ts
 * compileTemplate('<h1>Hello {{name}}</h1>', { name: 'Alice' });
 * // → '<h1>Hello Alice</h1>'
 * ```
 */
export function compileTemplate(
    template: string,
    data: Record<string, unknown>,
): string {
    // First: handle raw/unescaped output {{{key}}}
    let result = template.replace(/\{\{\{(\s*[\w.]+\s*)\}\}\}/g, (_match, key: string) => {
        const value = resolveValue(data, key.trim());
        return String(value ?? '');
    });

    // Then: handle escaped output {{key}}
    result = result.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (_match, key: string) => {
        const value = resolveValue(data, key.trim());
        return escapeHtml(String(value ?? ''));
    });

    return result;
}

/**
 * Resolve a dot-notation key from a nested object.
 */
function resolveValue(data: Record<string, unknown>, key: string): unknown {
    const parts = key.split('.');
    let current: unknown = data;

    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }

    return current;
}
