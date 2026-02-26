/**
 * @gao/security — RBAC Engine
 *
 * Role-Based Access Control + Permissions.
 * Supports Role Hierarchy (e.g., admin inherits from moderator).
 */

export interface RoleNode {
  name: string;
  permissions: Set<string>;
  inheritsFrom: Set<string>;
}

export interface RbacConfig {
  /** Example: { admin: { permissions: ['*'], inherits: ['moderator'] } } */
  roles?: Record<
    string,
    {
      permissions?: string[];
      inherits?: string[];
    }
  >;
}

export class RbacEngine {
  private roles = new Map<string, RoleNode>();

  constructor(config: RbacConfig = {}) {
    if (config.roles) {
      for (const [name, def] of Object.entries(config.roles)) {
        this.addRole(name, def.permissions, def.inherits);
      }
    }
  }

  /**
   * Add a role dynamically.
   */
  addRole(name: string, permissions: string[] = [], inherits: string[] = []): void {
    if (!this.roles.has(name)) {
      this.roles.set(name, { name, permissions: new Set(), inheritsFrom: new Set() });
    }

    const roleNode = this.roles.get(name) as RoleNode;

    for (const p of permissions) roleNode.permissions.add(p);
    for (const r of inherits) roleNode.inheritsFrom.add(r);
  }

  /**
   * Check if a list of user roles has a specific role (including via inheritance).
   */
  hasRole(userRoles: string[], targetRole: string): boolean {
    if (userRoles.includes(targetRole)) return true;

    // Check inherited roles using BFS or DFS
    const visited = new Set<string>();
    const queue = [...userRoles];

    while (queue.length > 0) {
      const current = queue.shift() as string;
      if (visited.has(current)) continue;
      visited.add(current);

      if (current === targetRole) return true;

      const node = this.roles.get(current);
      if (node) {
        for (const parent of node.inheritsFrom) {
          queue.push(parent);
        }
      }
    }

    return false;
  }

  /**
   * Check if a list of user roles has a specific permission.
   * Supports wildcard permissions (e.g., 'users.*' matches 'users.read').
   */
  hasPermission(userRoles: string[], permission: string): boolean {
    // If the permission is empty, technically requires no permission
    if (!permission) return true;

    const visited = new Set<string>();
    const queue = [...userRoles];

    while (queue.length > 0) {
      const current = queue.shift() as string;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.roles.get(current);
      if (node) {
        if (this.nodeHasPermission(node, permission)) return true;

        // Add parents to queue
        for (const parent of node.inheritsFrom) {
          queue.push(parent);
        }
      }
    }

    return false;
  }

  private nodeHasPermission(node: RoleNode, permission: string): boolean {
    for (const p of node.permissions) {
      if (this.matchPermission(p, permission)) return true;
    }
    return false;
  }

  /**
   * Simplified alias for hasPermission.
   */
  can(userRoles: string[], action: string): boolean {
    return this.hasPermission(userRoles, action);
  }

  /**
   * Evaluate a granted permission against a required permission.
   * Granted 'users.*' covers required 'users.read'
   * Granted '*' covers everything.
   */
  private matchPermission(granted: string, required: string): boolean {
    if (granted === required) return true;
    if (granted === '*') return true;

    if (granted.endsWith('.*')) {
      const prefix = granted.slice(0, -2);
      if (required.startsWith(`${prefix}.`) || required === prefix) {
        return true;
      }
    }

    return false;
  }
}
