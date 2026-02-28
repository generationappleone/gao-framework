/**
 * @gao/orm — Scopes
 *
 * Provides local and global scope functionality for models.
 *
 * Local scopes: Static methods on the model class prefixed with `scope` that
 * modify a query builder (e.g., `scopeActive(query)` -> `Model.active()`).
 *
 * Global scopes: Auto-applied query constraints registered via `addGlobalScope()`.
 * Can be opted out of with `withoutGlobalScope('scopeName')`.
 */

import type { ModelQueryBuilder } from './active-record.js';
import type { Model } from './active-record.js';

/** Type for a global scope callback. */
export type GlobalScopeCallback<T extends Model = Model> = (query: ModelQueryBuilder<T>) => void;

/** Storage for global scopes per model constructor. */
const globalScopeRegistry = new WeakMap<Function, Map<string, GlobalScopeCallback>>();

/**
 * Register a global scope for a model class.
 * @param ModelClass The model constructor
 * @param name Unique name for the scope
 * @param callback The scope constraint to auto-apply
 */
export function addGlobalScope<T extends Model>(
    ModelClass: new (...args: any[]) => T,
    name: string,
    callback: GlobalScopeCallback<T>,
): void {
    if (!globalScopeRegistry.has(ModelClass)) {
        globalScopeRegistry.set(ModelClass, new Map());
    }
    globalScopeRegistry.get(ModelClass)!.set(name, callback as GlobalScopeCallback);
}

/**
 * Get all global scopes for a model class.
 */
export function getGlobalScopes(ModelClass: Function): Map<string, GlobalScopeCallback> {
    return globalScopeRegistry.get(ModelClass) ?? new Map();
}

/**
 * Remove a global scope by name.
 */
export function removeGlobalScope(ModelClass: Function, name: string): void {
    const scopes = globalScopeRegistry.get(ModelClass);
    if (scopes) {
        scopes.delete(name);
    }
}

/**
 * Apply all global scopes to a query builder, optionally excluding specified scopes.
 */
export function applyGlobalScopes<T extends Model>(
    ModelClass: new (...args: any[]) => T,
    query: ModelQueryBuilder<T>,
    except: string[] = [],
): void {
    const scopes = getGlobalScopes(ModelClass);
    for (const [name, callback] of scopes) {
        if (!except.includes(name)) {
            callback(query);
        }
    }
}
