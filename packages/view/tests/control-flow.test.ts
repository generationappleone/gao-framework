/**
 * @gao/view — Control Flow Directive Tests
 */

import { describe, it, expect } from 'vitest';
import { GaoViewEngine } from '../src/engine.js';

const engine = new GaoViewEngine({
    viewsPath: '/tmp/views',
    cache: false,
});

describe('View Engine Control Flow Directives', () => {
    // ─── @if / @elseif / @else / @endif ──────────────────────────

    describe('@if / @else / @endif', () => {
        it('renders @if block when true', () => {
            const template = '@if(show)<p>Visible</p>@endif';
            const result = engine.renderString(template, { show: true });
            expect(result).toContain('<p>Visible</p>');
        });

        it('hides @if block when false', () => {
            const template = '@if(show)<p>Visible</p>@endif';
            const result = engine.renderString(template, { show: false });
            expect(result).not.toContain('Visible');
        });

        it('renders @else block when condition is false', () => {
            const template = '@if(loggedIn)<p>Welcome</p>@else<p>Please login</p>@endif';
            const result = engine.renderString(template, { loggedIn: false });
            expect(result).toContain('Please login');
            expect(result).not.toContain('Welcome');
        });

        it('handles @elseif', () => {
            const template = '@if(role === "admin")<p>Admin</p>@elseif(role === "editor")<p>Editor</p>@else<p>User</p>@endif';
            const result = engine.renderString(template, { role: 'editor' });
            expect(result).toContain('Editor');
            expect(result).not.toContain('Admin');
            expect(result).not.toContain('User');
        });

        it('handles expressions with comparison operators', () => {
            const template = '@if(count > 0)<p>Has items</p>@endif';
            const result = engine.renderString(template, { count: 5 });
            expect(result).toContain('Has items');
        });
    });

    // ─── @foreach / @endforeach ──────────────────────────────────

    describe('@foreach / @endforeach', () => {
        it('iterates over array', () => {
            const template = '<ul>@foreach(items as item)<li>${item}</li>@endforeach</ul>';
            const result = engine.renderString(template, { items: ['Apple', 'Banana', 'Cherry'] });
            expect(result).toContain('<li>Apple</li>');
            expect(result).toContain('<li>Banana</li>');
            expect(result).toContain('<li>Cherry</li>');
        });

        it('iterates with index', () => {
            const template = '@foreach(items as item, idx)<span>${idx}:${item}</span>@endforeach';
            const result = engine.renderString(template, { items: ['A', 'B'] });
            expect(result).toContain('0:A');
            expect(result).toContain('1:B');
        });

        it('handles empty arrays', () => {
            const template = '@foreach(items as item)<li>${item}</li>@endforeach';
            const result = engine.renderString(template, { items: [] });
            expect(result).toBe('');
        });

        it('accesses object properties in loop', () => {
            const template = '@foreach(users as user)<p>${user.name} (${user.email})</p>@endforeach';
            const result = engine.renderString(template, {
                users: [
                    { name: 'Alice', email: 'alice@test.com' },
                    { name: 'Bob', email: 'bob@test.com' },
                ],
            });
            expect(result).toContain('Alice (alice@test.com)');
            expect(result).toContain('Bob (bob@test.com)');
        });
    });

    // ─── Nested Control Flow ─────────────────────────────────────

    describe('nested control flow', () => {
        it('handles @if inside @foreach', () => {
            const template = '@foreach(users as user)<div>@if(user.active)<span>Active</span>@else<span>Inactive</span>@endif</div>@endforeach';
            const result = engine.renderString(template, {
                users: [
                    { active: true },
                    { active: false },
                ],
            });
            expect(result).toContain('<span>Active</span>');
            expect(result).toContain('<span>Inactive</span>');
        });

        it('handles @foreach inside @if', () => {
            const template = '@if(hasItems)<ul>@foreach(items as item)<li>${item}</li>@endforeach</ul>@endif';
            const result = engine.renderString(template, { hasItems: true, items: ['One', 'Two'] });
            expect(result).toContain('<li>One</li>');
            expect(result).toContain('<li>Two</li>');
        });
    });

    // ─── @unless / @endunless ────────────────────────────────────

    describe('@unless / @endunless', () => {
        it('renders when condition is false', () => {
            const template = '@unless(disabled)<button>Click</button>@endunless';
            const result = engine.renderString(template, { disabled: false });
            expect(result).toContain('<button>Click</button>');
        });

        it('hides when condition is true', () => {
            const template = '@unless(disabled)<button>Click</button>@endunless';
            const result = engine.renderString(template, { disabled: true });
            expect(result).not.toContain('Click');
        });
    });

    // ─── @empty / @endempty ──────────────────────────────────────

    describe('@empty / @endempty', () => {
        it('shows content for empty array', () => {
            const template = '@empty(items)<p>No items</p>@endempty';
            const result = engine.renderString(template, { items: [] });
            expect(result).toContain('No items');
        });

        it('hides for non-empty array', () => {
            const template = '@empty(items)<p>No items</p>@endempty';
            const result = engine.renderString(template, { items: ['one'] });
            expect(result).not.toContain('No items');
        });
    });

    // ─── @switch / @case / @endswitch ────────────────────────────

    describe('@switch / @case / @endswitch', () => {
        it('matches correct case', () => {
            const template = '@switch(status)@case("active")<span>Active</span>@break@case("inactive")<span>Inactive</span>@break@default<span>Unknown</span>@endswitch';
            const result = engine.renderString(template, { status: 'active' });
            expect(result).toContain('Active');
            expect(result).not.toContain('Inactive');
            expect(result).not.toContain('Unknown');
        });

        it('matches default case', () => {
            const template = '@switch(status)@case("active")<span>Active</span>@break@default<span>Unknown</span>@endswitch';
            const result = engine.renderString(template, { status: 'other' });
            expect(result).toContain('Unknown');
        });
    });

    // ─── @json ───────────────────────────────────────────────────

    describe('@json', () => {
        it('outputs escaped JSON', () => {
            const template = '<script>var config = @json(config)</script>';
            const result = engine.renderString(template, { config: { key: 'value' } });
            expect(result).toContain('&quot;key&quot;');
            expect(result).toContain('&quot;value&quot;');
        });
    });

    // ─── @class ──────────────────────────────────────────────────

    describe('@class', () => {
        it('outputs class names for truthy conditions', () => {
            const template = '<div class="@class({ \'active\': isActive, \'disabled\': isDisabled })">Test</div>';
            const result = engine.renderString(template, { isActive: true, isDisabled: false });
            expect(result).toContain('active');
            expect(result).not.toContain('disabled');
        });

        it('outputs multiple class names', () => {
            const template = '<div class="@class({ \'btn\': true, \'btn-primary\': primary })">Test</div>';
            const result = engine.renderString(template, { primary: true });
            expect(result).toContain('btn btn-primary');
        });
    });

    // ─── Escaped output inside control flow ──────────────────────

    describe('XSS safety in control flow', () => {
        it('auto-escapes ${} inside @foreach', () => {
            const template = '@foreach(items as item)<p>${item}</p>@endforeach';
            const result = engine.renderString(template, { items: ['<script>alert("xss")</script>'] });
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;script&gt;');
        });

        it('allows raw !{} inside @if', () => {
            const template = '@if(show)!{html}@endif';
            const result = engine.renderString(template, { show: true, html: '<b>Bold</b>' });
            expect(result).toContain('<b>Bold</b>');
        });
    });

    // ─── Backward Compatibility ──────────────────────────────────

    describe('backward compatibility', () => {
        it('existing <@ code @> syntax still works', () => {
            const template = '<@ layout("layouts/admin") @><@ section("content") @><h1>Title</h1><@ endsection() @>';
            // renderString doesn't support layout/section execution fully,
            // but the compile should not throw
            expect(() => engine.compile(template)).not.toThrow();
        });

        it('${variable} still escapes', () => {
            const result = engine.renderString('Hello ${name}!', { name: 'World' });
            expect(result).toBe('Hello World!');
        });

        it('!{raw} still outputs raw', () => {
            const result = engine.renderString('!{html}', { html: '<b>raw</b>' });
            expect(result).toBe('<b>raw</b>');
        });
    });
});
