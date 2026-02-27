import { describe, it, expect, beforeEach } from 'vitest';
import { ScopedContainer, createScopedContainer } from '../src/scoped-container.js';
import { Container, createContainer } from '../src/container.js';
import { ForbiddenError } from '../src/errors.js';
import { SERVICE_PERMISSIONS } from '../src/permission.js';

describe('ScopedContainer', () => {
    let parentContainer: Container;

    beforeEach(() => {
        parentContainer = createContainer();
        parentContainer.register('DatabaseDriver', () => ({ query: () => 'result' }));
        parentContainer.register('CacheService', () => ({ get: () => null }));
        parentContainer.register('Logger', () => ({ info: () => { } }));
    });

    it('should resolve services the plugin has permission for', () => {
        const scoped = createScopedContainer(parentContainer, 'test-plugin', ['db:read']);
        const db = scoped.resolve<object>('DatabaseDriver');
        expect(db).toBeDefined();
    });

    it('should throw ForbiddenError for services without permission', () => {
        const scoped = createScopedContainer(parentContainer, 'test-plugin', ['db:read']);
        expect(() => scoped.resolve('CacheService')).toThrow(ForbiddenError);
    });

    it('should include plugin name in error message', () => {
        const scoped = createScopedContainer(parentContainer, 'analytics-plugin', []);
        try {
            scoped.resolve('DatabaseDriver');
        } catch (err) {
            expect((err as Error).message).toContain('analytics-plugin');
            expect((err as Error).message).toContain('db:read');
        }
    });

    it('should allow services with no permission requirement', () => {
        // 'Logger' has no entry in SERVICE_PERMISSIONS, so it should be accessible
        const scoped = createScopedContainer(parentContainer, 'test', []);
        const logger = scoped.resolve<object>('Logger');
        expect(logger).toBeDefined();
    });

    it('should report has() based on permissions', () => {
        const scoped = createScopedContainer(parentContainer, 'test', ['db:read']);
        expect(scoped.has('DatabaseDriver')).toBe(true);
        expect(scoped.has('CacheService')).toBe(false);
        expect(scoped.has('Logger')).toBe(true); // no permission requirement
    });

    it('should report has() false for unregistered services', () => {
        const scoped = createScopedContainer(parentContainer, 'test', ['db:read']);
        expect(scoped.has('NonExistent')).toBe(false);
    });

    it('should expose owner and permissions', () => {
        const scoped = createScopedContainer(parentContainer, 'my-plugin', ['db:read', 'cache:read']);
        expect(scoped.owner).toBe('my-plugin');
        expect(scoped.grantedPermissions.size).toBe(2);
    });

    it('should support wildcard permissions', () => {
        // Register a special service needing net:fetch:api.example.com
        SERVICE_PERMISSIONS.set('ApiClient', 'net:fetch' as any);
        parentContainer.register('ApiClient', () => ({}));

        const scoped = createScopedContainer(parentContainer, 'test', ['net:fetch']);
        expect(() => scoped.resolve('ApiClient')).not.toThrow();

        // Cleanup
        SERVICE_PERMISSIONS.delete('ApiClient');
    });
});
