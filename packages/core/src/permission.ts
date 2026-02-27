/**
 * @gao/core — Permission System
 *
 * Deno-style permission declarations for the GAO plugin system.
 * Each plugin declares what resources it needs access to.
 * ScopedContainer enforces these permissions at resolve time.
 */

/**
 * Permission types for GAO Framework resources.
 * Uses colon-separated hierarchy for wildcard matching.
 */
export type Permission =
    | 'db:read'
    | 'db:write'
    | 'cache:read'
    | 'cache:write'
    | 'fs:read'
    | 'fs:write'
    | 'net:fetch'
    | `net:fetch:${string}`
    | 'env:read'
    | 'env:write'
    | 'queue:push'
    | 'queue:consume'
    | 'email:send'
    | 'log:write';

/**
 * Immutable set of permissions with hierarchical wildcard matching.
 *
 * Match rules:
 * - Exact: "db:read" matches "db:read"
 * - Wildcard prefix: "net:fetch" matches "net:fetch:api.example.com"
 */
export class PermissionSet {
    private readonly allowed: ReadonlySet<string>;

    constructor(permissions: readonly Permission[]) {
        this.allowed = new Set(permissions);
    }

    /**
     * Check if a permission is granted.
     * Supports exact match and wildcard prefix matching.
     */
    has(permission: Permission | string): boolean {
        // Exact match
        if (this.allowed.has(permission)) return true;

        // Hierarchical wildcard: check if any prefix matches.
        // e.g., "net:fetch" grants "net:fetch:api.example.com"
        const parts = permission.split(':');
        for (let i = parts.length - 1; i > 0; i--) {
            const prefix = parts.slice(0, i).join(':');
            if (this.allowed.has(prefix)) return true;
        }

        return false;
    }

    /** Returns all declared permissions as an array. */
    toArray(): Permission[] {
        return [...this.allowed] as Permission[];
    }

    /** Number of declared permissions. */
    get size(): number {
        return this.allowed.size;
    }

    /** Check if no permissions are declared. */
    get isEmpty(): boolean {
        return this.allowed.size === 0;
    }

    toString(): string {
        return `[${this.toArray().join(', ')}]`;
    }
}

/**
 * Maps DI service tokens to the permission required to access them.
 * Used by ScopedContainer to enforce access control.
 */
export const SERVICE_PERMISSIONS = new Map<string | symbol, Permission>([
    ['DatabaseDriver', 'db:read'],
    ['DatabaseWriteDriver', 'db:write'],
    ['CacheService', 'cache:read'],
    ['CacheWriteService', 'cache:write'],
    ['EmailService', 'email:send'],
    ['QueueService', 'queue:push'],
    ['QueueConsumer', 'queue:consume'],
    ['FileSystem', 'fs:read'],
    ['FileSystemWrite', 'fs:write'],
]);

/**
 * Register a custom service–permission mapping.
 * Use this to add permission requirements for your own services.
 */
export function registerServicePermission(
    token: string | symbol,
    permission: Permission,
): void {
    SERVICE_PERMISSIONS.set(token, permission);
}
