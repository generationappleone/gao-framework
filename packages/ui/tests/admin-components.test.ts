/**
 * @gao/ui — Admin Components Tests (10 tests)
 */
import { describe, it, expect } from 'vitest';
import {
    statCard, dataTable, barChart, lineChart, donutChart,
    form, toast, modal, badge, progress, avatar, breadcrumb,
    emptyState, alertBanner,
} from '../src/admin/admin-components.js';

// Load icon sets needed by components
import '../src/icons/sets/navigation.js';
import '../src/icons/sets/actions.js';
import '../src/icons/sets/status.js';
import '../src/icons/sets/social.js';
import '../src/icons/sets/data.js';

describe('Admin Components', () => {
    it('statCard should render value, label, and icon', () => {
        const html = statCard({ label: 'Revenue', value: '$12,340', icon: 'chart-bar' });
        expect(html).toContain('gao-admin-stat-card');
        expect(html).toContain('$12,340');
        expect(html).toContain('Revenue');
        expect(html).toContain('<svg');
    });

    it('statCard should render trend', () => {
        const html = statCard({ label: 'Users', value: 1520, icon: 'users', trend: { value: '+12%', direction: 'up' } });
        expect(html).toContain('gao-admin-stat-trend');
        expect(html).toContain('+12%');
        expect(html).toContain('up');
    });

    it('dataTable should render rows and columns', () => {
        const html = dataTable({
            columns: [
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
            ],
            rows: [
                { name: 'Alice', email: 'alice@test.com' },
                { name: 'Bob', email: 'bob@test.com' },
            ],
        });
        expect(html).toContain('gao-admin-table');
        expect(html).toContain('Alice');
        expect(html).toContain('bob@test.com');
        expect(html).toContain('<th');
        expect(html).toContain('Name');
    });

    it('barChart should produce valid SVG', () => {
        const html = barChart([
            { label: 'Jan', value: 100 },
            { label: 'Feb', value: 200 },
            { label: 'Mar', value: 150 },
        ]);
        expect(html).toContain('<svg');
        expect(html).toContain('<rect');
        expect(html).toContain('Jan');
        expect(html).toContain('gao-admin-chart-bar');
    });

    it('donutChart should produce SVG with legend', () => {
        const html = donutChart([
            { label: 'Desktop', value: 60 },
            { label: 'Mobile', value: 35 },
            { label: 'Tablet', value: 5 },
        ]);
        expect(html).toContain('<svg');
        expect(html).toContain('<circle');
        expect(html).toContain('Desktop');
        expect(html).toContain('Mobile');
    });

    it('form should render input fields', () => {
        const html = form([
            { name: 'email', label: 'Email', type: 'email', placeholder: 'name@example.com', required: true },
            { name: 'role', label: 'Role', type: 'select', options: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }] },
        ]);
        expect(html).toContain('type="email"');
        expect(html).toContain('required');
        expect(html).toContain('<select');
        expect(html).toContain('Admin');
    });

    it('toast should have correct class for type', () => {
        const html = toast({ message: 'Saved!', type: 'success' });
        expect(html).toContain('gao-admin-toast-success');
        expect(html).toContain('Saved!');
        expect(html).toContain('gao-admin-toast-close');
    });

    it('modal should have overlay and content', () => {
        const html = modal({ id: 'test-modal', title: 'Confirm', body: '<p>Are you sure?</p>' });
        expect(html).toContain('gao-admin-modal-overlay');
        expect(html).toContain('gao-admin-modal');
        expect(html).toContain('Confirm');
        expect(html).toContain('Are you sure?');
        expect(html).toContain('data-modal-close');
    });

    it('badge should render with color variants', () => {
        expect(badge({ text: 'Active', variant: 'success' })).toContain('gao-admin-badge-success');
        expect(badge({ text: 'Active', variant: 'danger', dot: true })).toContain('gao-admin-badge-dot');
    });

    it('progress should render with correct width', () => {
        const html = progress({ value: 75, max: 100, showLabel: true });
        expect(html).toContain('gao-admin-progress');
        expect(html).toContain('gao-admin-progress-fill');
        expect(html).toContain('75%');
    });

    it('avatar should render initials when no src', () => {
        const html = avatar({ name: 'John Doe', size: 'lg' });
        expect(html).toContain('gao-admin-avatar-lg');
        expect(html).toContain('JD');
        expect(html).toContain('title="John Doe"');
    });

    it('avatar should render img when src provided', () => {
        const html = avatar({ name: 'Jane', src: '/avatar.jpg' });
        expect(html).toContain('<img src="/avatar.jpg"');
    });

    it('breadcrumb should render links and separators', () => {
        const html = breadcrumb([
            { label: 'Home', href: '/' },
            { label: 'Users', href: '/users' },
            { label: 'Edit' },
        ]);
        expect(html).toContain('gao-admin-breadcrumb');
        expect(html).toContain('href="/"');
        expect(html).toContain('gao-admin-breadcrumb-separator');
        expect(html).toContain('Edit');
    });

    it('emptyState should render icon and title', () => {
        const html = emptyState('No data found', 'Try adjusting filters');
        expect(html).toContain('gao-admin-empty');
        expect(html).toContain('No data found');
        expect(html).toContain('Try adjusting filters');
    });

    it('alertBanner should render with correct type', () => {
        const html = alertBanner({ message: 'Warning!', type: 'warning' });
        expect(html).toContain('gao-admin-alert-warning');
        expect(html).toContain('Warning!');
    });
});
