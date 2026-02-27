import { describe, it, expect } from 'vitest';
import { validateManifest } from '../src/plugin-manifest.js';
import type { PluginManifest } from '../src/plugin-manifest.js';

describe('PluginManifest', () => {
    const validManifest: PluginManifest = {
        name: '@acme/analytics',
        version: '1.0.0',
        gao: '>=0.4.0',
        main: './dist/index.js',
        sandbox: 'trusted',
        permissions: ['db:read', 'cache:read'],
        hooks: ['onRequest', 'onResponse'],
    };

    it('should accept a valid manifest', () => {
        const [valid, result] = validateManifest(validManifest);
        expect(valid).toBe(true);
        expect((result as PluginManifest).name).toBe('@acme/analytics');
    });

    it('should reject null / non-object', () => {
        expect(validateManifest(null)[0]).toBe(false);
        expect(validateManifest('string')[0]).toBe(false);
        expect(validateManifest(42)[0]).toBe(false);
    });

    it('should reject missing name', () => {
        const [valid, err] = validateManifest({ ...validManifest, name: '' });
        expect(valid).toBe(false);
        expect(err).toContain('name');
    });

    it('should reject missing version', () => {
        const [valid] = validateManifest({ ...validManifest, version: undefined });
        expect(valid).toBe(false);
    });

    it('should reject invalid sandbox type', () => {
        const [valid, err] = validateManifest({ ...validManifest, sandbox: 'docker' });
        expect(valid).toBe(false);
        expect(err).toContain('sandbox');
    });

    it('should reject missing permissions array', () => {
        const [valid] = validateManifest({ ...validManifest, permissions: 'db:read' });
        expect(valid).toBe(false);
    });

    it('should accept worker sandbox', () => {
        const [valid] = validateManifest({ ...validManifest, sandbox: 'worker' });
        expect(valid).toBe(true);
    });

    it('should accept wasm sandbox', () => {
        const [valid] = validateManifest({ ...validManifest, sandbox: 'wasm' });
        expect(valid).toBe(true);
    });
});
