/**
 * @gao/core — Scoped Container
 *
 * A restricted view of the DI Container that enforces permission checks.
 * Plugins receive a ScopedContainer instead of the full Container,
 * ensuring they can only access services they've declared in their permissions.
 */

import type { Container } from './container.js';
import { ForbiddenError } from './errors.js';
import { PermissionSet, SERVICE_PERMISSIONS } from './permission.js';
import type { Permission } from './permission.js';

export class ScopedContainer {
    constructor(
        private readonly parent: Container,
        private readonly permissions: PermissionSet,
        private readonly pluginName: string,
    ) { }

    /**
     * Resolve a service by its token.
     * Checks if the plugin has permission to access the service.
     * If the service has no registered permission requirement, access is granted.
     *
     * @throws ForbiddenError if the plugin lacks the required permission.
     */
    resolve<T>(token: symbol | string): T {
        const requiredPermission = SERVICE_PERMISSIONS.get(token);

        if (requiredPermission && !this.permissions.has(requiredPermission)) {
            throw new ForbiddenError(
                `Plugin "${this.pluginName}" denied access to "${String(token)}". ` +
                `Required permission: "${requiredPermission}". ` +
                `Declared permissions: ${this.permissions.toString()}`,
            );
        }

        return this.parent.resolve<T>(token);
    }

    /**
     * Check if a service is registered AND the plugin has permission to access it.
     */
    has(token: symbol | string): boolean {
        const requiredPermission = SERVICE_PERMISSIONS.get(token);
        if (requiredPermission && !this.permissions.has(requiredPermission)) {
            return false;
        }
        return this.parent.has(token);
    }

    /** Get the plugin name this scope belongs to. */
    get owner(): string {
        return this.pluginName;
    }

    /** Get the permission set. */
    get grantedPermissions(): PermissionSet {
        return this.permissions;
    }
}

/**
 * Create a scoped container for a plugin with specific permissions.
 */
export function createScopedContainer(
    parent: Container,
    pluginName: string,
    permissions: readonly Permission[],
): ScopedContainer {
    return new ScopedContainer(parent, new PermissionSet(permissions), pluginName);
}
