/**
 * @gao/core — Plugin Manifest
 *
 * Defines the structure of a gao-plugin.json manifest file.
 * Each plugin declares its metadata, permissions, sandbox level, and hooks.
 */

import type { Permission } from './permission.js';

export interface PluginManifest {
    /** Unique plugin name (e.g., "@acme/analytics"). */
    name: string;
    /** SemVer version. */
    version: string;
    /** Minimum GAO framework version required. */
    gao: string;
    /** Entry point file (relative to plugin root). */
    main: string;
    /** Plugin description. */
    description?: string;
    /** Author name or object. */
    author?: string;

    /** Sandbox level:
     * - "trusted": runs in-process with ScopedContainer.
     * - "worker": runs in a Worker Thread with V8 resourceLimits.
     * - "wasm": (future) runs in WebAssembly sandbox.
     */
    sandbox: 'trusted' | 'worker' | 'wasm';

    /** Permissions the plugin needs. */
    permissions: Permission[];

    /** Budget overrides (merged with plan defaults). */
    budget?: Partial<{
        maxCpuTimeMs: number;
        maxDbQueries: number;
        maxResponseBytes: number;
        maxHeapMB: number;
    }>;

    /** Hooks the plugin registers for. */
    hooks?: string[];

    /** Cryptographic signature for marketplace verification. */
    signature?: string;
}

/**
 * Validate a plugin manifest has required fields.
 * Returns [true, manifest] if valid, [false, errorMessage] otherwise.
 */
export function validateManifest(
    raw: unknown,
): [true, PluginManifest] | [false, string] {
    if (!raw || typeof raw !== 'object') {
        return [false, 'Manifest must be a non-null object'];
    }

    const obj = raw as Record<string, unknown>;

    if (typeof obj.name !== 'string' || obj.name.length === 0) {
        return [false, 'Manifest "name" is required and must be a non-empty string'];
    }
    if (typeof obj.version !== 'string') {
        return [false, 'Manifest "version" is required'];
    }
    if (typeof obj.gao !== 'string') {
        return [false, 'Manifest "gao" (framework version compatibility) is required'];
    }
    if (typeof obj.main !== 'string') {
        return [false, 'Manifest "main" (entry point) is required'];
    }
    if (!['trusted', 'worker', 'wasm'].includes(obj.sandbox as string)) {
        return [false, 'Manifest "sandbox" must be "trusted", "worker", or "wasm"'];
    }
    if (!Array.isArray(obj.permissions)) {
        return [false, 'Manifest "permissions" must be an array'];
    }

    return [true, raw as PluginManifest];
}
