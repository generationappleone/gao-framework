/**
 * @gao/core — Plugin Marketplace
 *
 * Orchestrates plugin lifecycle for trusted and sandboxed plugins:
 * - Install: load trusted plugins in-process with ScopedContainer, worker plugins in WorkerSandbox.
 * - Invoke: broadcast hooks to all installed plugins.
 * - Uninstall: cleanup and terminate workers.
 */

import type { Container } from './container.js';
import type { PluginManifest } from './plugin-manifest.js';
import { PermissionSet } from './permission.js';
import { ScopedContainer } from './scoped-container.js';
import { WorkerSandbox } from './worker-sandbox.js';
import { validateManifest } from './plugin-manifest.js';

export interface InstalledPlugin {
    manifest: PluginManifest;
    sandbox: ScopedContainer | WorkerSandbox;
    type: 'trusted' | 'worker';
}

export class PluginMarketplace {
    private readonly plugins = new Map<string, InstalledPlugin>();

    constructor(
        private readonly container: Container,
        private readonly workerHostPath?: string,
    ) { }

    /**
     * Install a plugin from its manifest.
     * - "trusted" sandbox → ScopedContainer + direct import
     * - "worker" sandbox → WorkerSandbox with resource limits
     * - "wasm" sandbox → Placeholder for future WASM support
     */
    async install(manifest: PluginManifest): Promise<void> {
        const [valid, errorOrManifest] = validateManifest(manifest);
        if (!valid) {
            throw new Error(`Invalid plugin manifest: ${errorOrManifest}`);
        }

        if (this.plugins.has(manifest.name)) {
            throw new Error(`Plugin "${manifest.name}" is already installed`);
        }

        if (manifest.sandbox === 'trusted') {
            const permissions = new PermissionSet(manifest.permissions);
            const scopedContainer = new ScopedContainer(
                this.container,
                permissions,
                manifest.name,
            );
            this.plugins.set(manifest.name, {
                manifest,
                sandbox: scopedContainer,
                type: 'trusted',
            });
        } else if (manifest.sandbox === 'worker') {
            const sandbox = new WorkerSandbox({
                maxHeapMB: manifest.budget?.maxHeapMB ?? 128,
            });

            const hostPath = this.workerHostPath ?? new URL('./plugin-worker-host.js', import.meta.url).pathname;

            await sandbox.load(manifest, hostPath);

            this.plugins.set(manifest.name, {
                manifest,
                sandbox,
                type: 'worker',
            });
        } else if (manifest.sandbox === 'wasm') {
            throw new Error('WASM sandbox is not yet supported. Use "trusted" or "worker".');
        }
    }

    /**
     * Invoke a hook on all installed plugins that declared it.
     * Returns a map of plugin name → result.
     */
    async invokeHook(hook: string, data?: unknown): Promise<Map<string, unknown>> {
        const results = new Map<string, unknown>();

        for (const [name, plugin] of this.plugins) {
            if (plugin.manifest.hooks && !plugin.manifest.hooks.includes(hook)) {
                continue; // Plugin didn't declare this hook
            }

            try {
                if (plugin.type === 'worker' && plugin.sandbox instanceof WorkerSandbox) {
                    const result = await plugin.sandbox.invoke(hook, data);
                    results.set(name, result);
                } else {
                    // For trusted plugins, hook invocation is handled by the plugin itself
                    results.set(name, undefined);
                }
            } catch (err) {
                results.set(name, { error: (err as Error).message });
            }
        }

        return results;
    }

    /** Uninstall a plugin by name, terminating its sandbox if necessary. */
    async uninstall(name: string): Promise<boolean> {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        if (plugin.type === 'worker' && plugin.sandbox instanceof WorkerSandbox) {
            await plugin.sandbox.terminate();
        }

        this.plugins.delete(name);
        return true;
    }

    /** List all installed plugins. */
    list(): InstalledPlugin[] {
        return [...this.plugins.values()];
    }

    /** Get an installed plugin by name. */
    get(name: string): InstalledPlugin | undefined {
        return this.plugins.get(name);
    }

    /** Number of installed plugins. */
    get size(): number {
        return this.plugins.size;
    }

    /** Uninstall all plugins and terminate all workers. */
    async shutdown(): Promise<void> {
        for (const [name] of this.plugins) {
            await this.uninstall(name);
        }
    }
}
