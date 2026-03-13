/**
 * @gao/ui — General Component Tests
 *
 * Tests for all 23 general-purpose UI components.
 */

import { describe, it, expect } from 'vitest';
import { componentCSS } from '../src/components/component-styles.js';
import { gaoGrid, gaoContainer, gaoStack } from '../src/components/layout.js';
import { gaoButton, gaoButtonGroup, gaoDropdownMenu } from '../src/components/actions.js';
import { gaoInput, gaoSelect, gaoCheckbox, gaoSwitchToggle, gaoFormGroup } from '../src/components/forms.js';
import { gaoAlert, gaoTooltip, gaoSpinner } from '../src/components/feedback.js';
import { gaoCard, gaoAccordion, gaoListGroup, gaoSkeleton } from '../src/components/data-display.js';
import { gaoNavbar, gaoTabs, gaoPagination } from '../src/components/navigation.js';
import { gaoCarousel, gaoOffcanvas } from '../src/components/media.js';

// ─── Component Styles ────────────────────────────────────────

describe('Component CSS', () => {
    it('should contain button styles', () => {
        expect(componentCSS).toContain('.gao-btn');
        expect(componentCSS).toContain('.gao-btn-primary');
        expect(componentCSS).toContain('.gao-btn-secondary');
    });

    it('should contain card styles', () => {
        expect(componentCSS).toContain('.gao-card');
        expect(componentCSS).toContain('.gao-card-glass');
    });

    it('should contain form styles', () => {
        expect(componentCSS).toContain('.gao-input');
        expect(componentCSS).toContain('.gao-select');
        expect(componentCSS).toContain('.gao-switch');
    });

    it('should contain component animations', () => {
        expect(componentCSS).toContain('@keyframes gao-spin');
        expect(componentCSS).toContain('@keyframes gao-shimmer');
    });
});

// ─── Layout Components ───────────────────────────────────────

describe('gaoGrid()', () => {
    it('should render N columns', () => {
        const html = gaoGrid({ columns: 3, children: ['<div>1</div>', '<div>2</div>'] });
        expect(html).toContain('gao-grid-3');
        expect(html).toContain('<div>1</div>');
    });

    it('should render auto-responsive grid', () => {
        const html = gaoGrid({ children: ['<div>1</div>'] });
        expect(html).toContain('gao-grid-auto');
    });
});

describe('gaoContainer()', () => {
    it('should render with max-width class', () => {
        const html = gaoContainer({ size: 'lg', children: '<p>Content</p>' });
        expect(html).toContain('gao-container-lg');
    });

    it('should default to xl', () => {
        const html = gaoContainer({ children: '<p>Content</p>' });
        expect(html).toContain('gao-container');
    });
});

describe('gaoStack()', () => {
    it('should render vertical stack by default', () => {
        const html = gaoStack({ children: ['<div>A</div>', '<div>B</div>'] });
        expect(html).toContain('flex-direction: column');
    });

    it('should render horizontal stack', () => {
        const html = gaoStack({ direction: 'horizontal', children: ['<div>A</div>'] });
        expect(html).toContain('flex-direction: row');
    });
});

// ─── Action Components ───────────────────────────────────────

describe('gaoButton()', () => {
    it('should render <button> tag by default', () => {
        const html = gaoButton({ label: 'Click' });
        expect(html).toContain('<button');
        expect(html).toContain('Click');
    });

    it('should render <a> when href is provided', () => {
        const html = gaoButton({ label: 'Link', href: '/page' });
        expect(html).toContain('<a href="/page"');
        expect(html).toContain('role="button"');
    });

    it('should apply variant class', () => {
        const html = gaoButton({ label: 'Danger', variant: 'danger' });
        expect(html).toContain('gao-btn-danger');
    });

    it('should handle loading state', () => {
        const html = gaoButton({ label: 'Save', loading: true });
        expect(html).toContain('gao-btn-loading');
    });

    it('should handle disabled state', () => {
        const html = gaoButton({ label: 'Disabled', disabled: true });
        expect(html).toContain('disabled');
        expect(html).toContain('aria-disabled="true"');
    });
});

describe('gaoButtonGroup()', () => {
    it('should render group of buttons', () => {
        const html = gaoButtonGroup({ buttons: [{ label: 'A' }, { label: 'B' }] });
        expect(html).toContain('gao-btn-group');
        expect(html).toContain('role="group"');
        expect(html).toContain('A');
        expect(html).toContain('B');
    });
});

describe('gaoDropdownMenu()', () => {
    it('should render trigger and menu', () => {
        const html = gaoDropdownMenu({
            trigger: { label: 'Options' },
            items: [{ label: 'Edit' }, { divider: true }, { label: 'Delete' }],
        });
        expect(html).toContain('gao-dropdown');
        expect(html).toContain('role="menu"');
        expect(html).toContain('Edit');
        expect(html).toContain('gao-dropdown-divider');
    });
});

// ─── Form Components ─────────────────────────────────────────

describe('gaoInput()', () => {
    it('should render label and input', () => {
        const html = gaoInput({ name: 'email', label: 'Email' });
        expect(html).toContain('<label');
        expect(html).toContain('<input');
        expect(html).toContain('Email');
    });

    it('should show error message', () => {
        const html = gaoInput({ name: 'email', error: 'Invalid email' });
        expect(html).toContain('gao-input-error');
        expect(html).toContain('Invalid email');
        expect(html).toContain('role="alert"');
    });
});

describe('gaoSelect()', () => {
    it('should render options', () => {
        const html = gaoSelect({
            name: 'color',
            options: [{ value: 'red', text: 'Red' }, { value: 'blue', text: 'Blue' }],
        });
        expect(html).toContain('<select');
        expect(html).toContain('value="red"');
        expect(html).toContain('Blue');
    });
});

describe('gaoCheckbox()', () => {
    it('should render checked attribute', () => {
        const html = gaoCheckbox({ name: 'agree', label: 'I agree', checked: true });
        expect(html).toContain('checked');
        expect(html).toContain('I agree');
    });
});

describe('gaoSwitchToggle()', () => {
    it('should render switch track and thumb', () => {
        const html = gaoSwitchToggle({ name: 'dark', label: 'Dark mode' });
        expect(html).toContain('gao-switch-track');
        expect(html).toContain('gao-switch-thumb');
    });
});

describe('gaoFormGroup()', () => {
    it('should wrap children with label', () => {
        const html = gaoFormGroup({ label: 'Name', children: '<input>' });
        expect(html).toContain('gao-form-group');
        expect(html).toContain('Name');
        expect(html).toContain('<input>');
    });
});

// ─── Feedback Components ─────────────────────────────────────

describe('gaoAlert()', () => {
    it('should render with role="alert"', () => {
        const html = gaoAlert({ message: 'Success!', type: 'success' });
        expect(html).toContain('role="alert"');
        expect(html).toContain('gao-alert-success');
    });

    it('should render close button when dismissible', () => {
        const html = gaoAlert({ message: 'Note', dismissible: true });
        expect(html).toContain('gao-alert-close');
    });
});

describe('gaoTooltip()', () => {
    it('should render tooltip with position class', () => {
        const html = gaoTooltip({ text: 'Help text', position: 'bottom', children: '<button>?</button>' });
        expect(html).toContain('gao-tooltip-bottom');
        expect(html).toContain('role="tooltip"');
    });
});

describe('gaoSpinner()', () => {
    it('should render ring spinner with size', () => {
        const html = gaoSpinner({ variant: 'ring', size: 'lg' });
        expect(html).toContain('gao-spinner-ring');
        expect(html).toContain('gao-spinner-lg');
        expect(html).toContain('role="status"');
    });

    it('should render dots spinner', () => {
        const html = gaoSpinner({ variant: 'dots' });
        expect(html).toContain('gao-spinner-dots');
        expect(html).toContain('gao-spinner-dot');
    });
});

// ─── Data Display Components ─────────────────────────────────

describe('gaoCard()', () => {
    it('should render article with card class', () => {
        const html = gaoCard({ title: 'Title', body: '<p>Content</p>' });
        expect(html).toContain('<article');
        expect(html).toContain('gao-card');
        expect(html).toContain('Title');
    });

    it('should apply variant class', () => {
        const html = gaoCard({ body: 'Content', variant: 'glass' });
        expect(html).toContain('gao-card-glass');
    });
});

describe('gaoAccordion()', () => {
    it('should render details/summary elements', () => {
        const html = gaoAccordion({ items: [{ title: 'FAQ 1', content: 'Answer 1' }] });
        expect(html).toContain('<details');
        expect(html).toContain('<summary');
        expect(html).toContain('FAQ 1');
    });
});

describe('gaoListGroup()', () => {
    it('should render list items', () => {
        const html = gaoListGroup({ items: [{ label: 'Item 1' }, { label: 'Item 2', active: true }] });
        expect(html).toContain('gao-list-group');
        expect(html).toContain('Item 1');
        expect(html).toContain('gao-list-group-item-active');
    });
});

describe('gaoSkeleton()', () => {
    it('should render text skeleton with lines', () => {
        const html = gaoSkeleton({ type: 'text', lines: 3 });
        expect(html).toContain('gao-skeleton-text');
        expect(html).toContain('aria-busy="true"');
    });

    it('should render circle skeleton', () => {
        const html = gaoSkeleton({ type: 'circle', width: '48px' });
        expect(html).toContain('gao-skeleton-circle');
    });
});

// ─── Navigation Components ───────────────────────────────────

describe('gaoNavbar()', () => {
    it('should render nav with brand and items', () => {
        const html = gaoNavbar({
            brand: { name: 'GAO' },
            items: [{ label: 'Home', href: '/', active: true }],
        });
        expect(html).toContain('<nav');
        expect(html).toContain('GAO');
        expect(html).toContain('gao-navbar-link-active');
    });
});

describe('gaoTabs()', () => {
    it('should render tab triggers and panels', () => {
        const html = gaoTabs({ tabs: [{ label: 'Tab 1', content: 'Content 1' }] });
        expect(html).toContain('role="tablist"');
        expect(html).toContain('role="tab"');
        expect(html).toContain('role="tabpanel"');
        expect(html).toContain('Tab 1');
    });
});

describe('gaoPagination()', () => {
    it('should render page navigation', () => {
        const html = gaoPagination({ current: 3, total: 100, perPage: 10, baseUrl: '/items' });
        expect(html).toContain('aria-label="Pagination"');
        expect(html).toContain('aria-current="page"');
        expect(html).toContain('3');
    });

    it('should return empty for single page', () => {
        const html = gaoPagination({ current: 1, total: 5, perPage: 10, baseUrl: '/' });
        expect(html).toBe('');
    });
});

// ─── Media Components ────────────────────────────────────────

describe('gaoCarousel()', () => {
    it('should render slides with scroll snap', () => {
        const html = gaoCarousel({ slides: [{ content: '<img src="a.jpg">' }, { content: '<img src="b.jpg">' }] });
        expect(html).toContain('gao-carousel');
        expect(html).toContain('gao-carousel-slide');
        expect(html).toContain('gao-carousel-dot');
    });
});

describe('gaoOffcanvas()', () => {
    it('should render offcanvas panel', () => {
        const html = gaoOffcanvas({ title: 'Menu', content: '<p>Nav</p>', position: 'left' });
        expect(html).toContain('gao-offcanvas-left');
        expect(html).toContain('role="dialog"');
        expect(html).toContain('Menu');
    });
});
