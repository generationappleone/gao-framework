import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginMarketplace } from '../src/plugin-marketplace.js';
import { Container, createContainer } from '../src/container.js';
import { ScopedContainer } from '../src/scoped-container.js';
import type { PluginManifest } from '../src/plugin-manifest.js';

describe('PluginMarketplace', () => {
    let container: Container;
    let marketplace: PluginMarketplace;

    const trustedManifest: PluginManifest = {
        name: 'test-plugin',
        version: '1.0.0',
        gao: '>=0.4.0',
        main: './plugin.js',
        sandbox: 'trusted',
        permissions: ['db:read', 'cache:read'],
        hooks: ['onRequest'],
    };

    beforeEach(() => {
        container = createContainer();
        container.register('DatabaseDriver', () => ({ query: () => 'result' }));
        container.register('CacheService', () => ({ get: () => null }));
        marketplace = new PluginMarketplace(container);
    });

    afterEach(async () => {
        await marketplace.shutdown();
    });

    it('should install a trusted plugin with ScopedContainer', async () => {
        await marketplace.install(trustedManifest);
        expect(marketplace.size).toBe(1);

        const plugin = marketplace.get('test-plugin');
        expect(plugin).toBeDefined();
        expect(plugin!.type).toBe('trusted');
        expect(plugin!.sandbox).toBeInstanceOf(ScopedContainer);
    });

    it('should reject duplicate plugin names', async () => {
        await marketplace.install(trustedManifest);
        await expect(marketplace.install(trustedManifest)).rejects.toThrow('already installed');
    });

    it('should reject invalid manifest', async () => {
        const invalid = { ...trustedManifest, name: '' };
        await expect(marketplace.install(invalid)).rejects.toThrow('Invalid plugin manifest');
    });

    it('should list installed plugins', async () => {
        await marketplace.install(trustedManifest);
        const list = marketplace.list();
        expect(list.length).toBe(1);
        expect(list[0]!.manifest.name).toBe('test-plugin');
    });

    it('should uninstall a plugin', async () => {
        await marketplace.install(trustedManifest);
        const removed = await marketplace.uninstall('test-plugin');
        expect(removed).toBe(true);
        expect(marketplace.size).toBe(0);
    });

    it('should return false when uninstalling non-existent plugin', async () => {
        const removed = await marketplace.uninstall('nonexistent');
        expect(removed).toBe(false);
    });

    it('should enforce permissions via ScopedContainer', async () => {
        await marketplace.install(trustedManifest);
        const plugin = marketplace.get('test-plugin')!;
        const scoped = plugin.sandbox as ScopedContainer;

        // db:read is allowed
        expect(() => scoped.resolve('DatabaseDriver')).not.toThrow();
        // cache:read is allowed
        expect(() => scoped.resolve('CacheService')).not.toThrow();
    });

    it('should reject WASM sandbox (not yet supported)', async () => {
        const wasmManifest: PluginManifest = {
            ...trustedManifest,
            name: 'wasm-plugin',
            sandbox: 'wasm',
        };
        await expect(marketplace.install(wasmManifest)).rejects.toThrow('WASM sandbox is not yet supported');
    });

    it('should broadcast hooks to installed plugins', async () => {
        await marketplace.install(trustedManifest);
        const results = await marketplace.invokeHook('onRequest', { path: '/test' });
        expect(results.size).toBe(1);
    });

    it('should shutdown all plugins', async () => {
        await marketplace.install(trustedManifest);
        await marketplace.install({
            ...trustedManifest,
            name: 'plugin-2',
        });
        expect(marketplace.size).toBe(2);

        await marketplace.shutdown();
        expect(marketplace.size).toBe(0);
    });
});
