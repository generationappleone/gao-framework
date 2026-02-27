/**
 * @gao/ui — Admin Template Tests (10 tests)
 */
import { describe, it, expect } from 'vitest';
import { createAdminTemplate, type SidebarItem } from '../src/admin/admin-template.js';
import { adminCSS } from '../src/admin/admin-styles.js';
import { adminScripts } from '../src/admin/admin-scripts.js';

// Load icons/fonts for template generation
import '../src/icons/sets/navigation.js';
import '../src/icons/sets/actions.js';
import '../src/icons/sets/status.js';
import '../src/icons/sets/social.js';
import '../src/icons/sets/data.js';
import '../src/icons/sets/device.js';
import '../src/icons/sets/media.js';
import '../src/icons/sets/commerce.js';
import '../src/icons/sets/nature.js';
import '../src/icons/sets/misc.js';

const testSidebar: SidebarItem[] = [
    { label: 'Dashboard', icon: 'home', href: '/', active: true, section: 'Main' },
    { label: 'Users', icon: 'users', href: '/users', section: 'Management' },
    { label: 'Settings', icon: 'lock', href: '/settings' },
];

describe('Admin Template', () => {
    it('should generate valid HTML layout', () => {
        const html = createAdminTemplate.layout({
            title: 'Test Admin',
            sidebar: testSidebar,
            content: '<h1>Hello</h1>',
        });
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html lang="en">');
        expect(html).toContain('<title>Test Admin</title>');
        expect(html).toContain('gao-admin-wrapper');
        expect(html).toContain('gao-admin-layout');
        expect(html).toContain('<h1>Hello</h1>');
        expect(html).toContain('</html>');
    });

    it('CSS should contain all semantic color tokens', () => {
        expect(adminCSS).toContain('--gao-primary');
        expect(adminCSS).toContain('--gao-accent');
        expect(adminCSS).toContain('--gao-success');
        expect(adminCSS).toContain('--gao-warning');
        expect(adminCSS).toContain('--gao-danger');
        expect(adminCSS).toContain('--gao-info');
        expect(adminCSS).toContain('--gao-bg');
        expect(adminCSS).toContain('--gao-surface');
        expect(adminCSS).toContain('--gao-text');
        expect(adminCSS).toContain('--gao-border');
    });

    it('should render sidebar items with icons', () => {
        const html = createAdminTemplate.sidebar(testSidebar, 'MyApp', 'layout');
        expect(html).toContain('gao-admin-sidebar');
        expect(html).toContain('Dashboard');
        expect(html).toContain('Users');
        expect(html).toContain('Settings');
        expect(html).toContain('<svg');
        expect(html).toContain('gao-admin-sidebar-item active');
    });

    it('should render navbar with user info', () => {
        const html = createAdminTemplate.navbar({
            showSearch: true,
            user: { name: 'John Doe', role: 'Admin' },
            notifications: 5,
        });
        expect(html).toContain('gao-admin-navbar');
        expect(html).toContain('John Doe');
        expect(html).toContain('5');
        expect(html).toContain('gao-admin-search');
    });

    it('CSS should have dark mode variables', () => {
        expect(adminCSS).toContain('[data-theme="dark"]');
        expect(adminCSS).toContain('prefers-color-scheme: dark');
        expect(adminCSS).toContain('--gao-glass-bg');
    });

    it('CSS should have responsive breakpoints', () => {
        expect(adminCSS).toContain('@media (max-width: 1024px)');
        expect(adminCSS).toContain('@media (max-width: 768px)');
        expect(adminCSS).toContain('@media (max-width: 480px)');
    });

    it('should use GaoIcons in sidebar', () => {
        const html = createAdminTemplate.sidebar(testSidebar);
        expect(html).toContain('gao-icon-home');
        expect(html).toContain('gao-icon-users');
        expect(html).toContain('gao-icon-lock');
    });

    it('should inject fonts CSS in layout', () => {
        const html = createAdminTemplate.layout({
            title: 'Test',
            sidebar: testSidebar,
            content: '',
        });
        expect(html).toContain('gao-fonts');
    });

    it('should set page title correctly', () => {
        const html = createAdminTemplate.layout({
            title: 'My Dashboard',
            sidebar: testSidebar,
            content: '',
        });
        expect(html).toContain('<title>My Dashboard</title>');
    });

    it('should inject admin scripts in layout', () => {
        const html = createAdminTemplate.layout({
            title: 'Test',
            sidebar: testSidebar,
            content: '',
        });
        expect(html).toContain('<script>');
        expect(html).toContain('gao-admin-navbar-toggle');
        expect(html).toContain('gao-theme');
    });
});

describe('Admin Scripts', () => {
    it('should contain sidebar toggle logic', () => {
        expect(adminScripts).toContain('gao-admin-navbar-toggle');
        expect(adminScripts).toContain('classList.toggle');
    });

    it('should contain dark mode logic', () => {
        expect(adminScripts).toContain('gao-admin-theme-toggle');
        expect(adminScripts).toContain('localStorage');
        expect(adminScripts).toContain('data-theme');
    });
});
