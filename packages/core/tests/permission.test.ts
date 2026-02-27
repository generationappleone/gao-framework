import { describe, it, expect } from 'vitest';
import { PermissionSet, SERVICE_PERMISSIONS, registerServicePermission } from '../src/permission.js';
import type { Permission } from '../src/permission.js';

describe('PermissionSet', () => {
    it('should match exact permissions', () => {
        const set = new PermissionSet(['db:read', 'cache:write']);
        expect(set.has('db:read')).toBe(true);
        expect(set.has('cache:write')).toBe(true);
        expect(set.has('db:write')).toBe(false);
    });

    it('should match wildcard prefix (net:fetch grants net:fetch:*)', () => {
        const set = new PermissionSet(['net:fetch']);
        expect(set.has('net:fetch')).toBe(true);
        expect(set.has('net:fetch:api.example.com')).toBe(true);
        expect(set.has('net:fetch:evil.com')).toBe(true);
    });

    it('should not match domain-scoped when only specific domain granted', () => {
        const set = new PermissionSet(['net:fetch:api.example.com'] as Permission[]);
        expect(set.has('net:fetch:api.example.com')).toBe(true);
        expect(set.has('net:fetch:evil.com')).toBe(false);
        // Specific domain does NOT grant generic net:fetch
        expect(set.has('net:fetch')).toBe(false);
    });

    it('should have correct size', () => {
        const set = new PermissionSet(['db:read', 'db:write', 'cache:read']);
        expect(set.size).toBe(3);
    });

    it('should report isEmpty', () => {
        expect(new PermissionSet([]).isEmpty).toBe(true);
        expect(new PermissionSet(['db:read']).isEmpty).toBe(false);
    });

    it('should return array of permissions', () => {
        const perms: Permission[] = ['db:read', 'cache:write'];
        const set = new PermissionSet(perms);
        expect(set.toArray()).toEqual(expect.arrayContaining(perms));
        expect(set.toArray().length).toBe(2);
    });

    it('should produce readable toString', () => {
        const set = new PermissionSet(['db:read']);
        expect(set.toString()).toContain('db:read');
    });

    it('should deduplicate permissions', () => {
        const set = new PermissionSet(['db:read', 'db:read', 'db:read']);
        expect(set.size).toBe(1);
    });
});

describe('SERVICE_PERMISSIONS', () => {
    it('should have default mappings', () => {
        expect(SERVICE_PERMISSIONS.get('DatabaseDriver')).toBe('db:read');
        expect(SERVICE_PERMISSIONS.get('CacheService')).toBe('cache:read');
        expect(SERVICE_PERMISSIONS.get('EmailService')).toBe('email:send');
    });

    it('should support custom registration', () => {
        registerServicePermission('MyService', 'db:write');
        expect(SERVICE_PERMISSIONS.get('MyService')).toBe('db:write');
        // Cleanup
        SERVICE_PERMISSIONS.delete('MyService');
    });
});
