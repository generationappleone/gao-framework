import { describe, expect, it } from 'vitest';
import { RbacEngine } from '../src/auth/rbac.js';

describe('RBAC Engine', () => {
  it('should initialize roles from config', () => {
    const rbac = new RbacEngine({
      roles: {
        admin: { permissions: ['*'] },
        editor: { permissions: ['posts.*', 'comments.*'] },
        user: { permissions: ['posts.read'] },
      },
    });

    expect(rbac.can(['user'], 'posts.read')).toBe(true);
    expect(rbac.can(['user'], 'posts.write')).toBe(false);
  });

  it('should resolve inherited roles', () => {
    const rbac = new RbacEngine({
      roles: {
        superadmin: { inherits: ['admin'] },
        admin: { inherits: ['editor'] },
        editor: { permissions: ['edit_article'] },
      },
    });

    // superadmin -> admin -> editor -> edit_article
    expect(rbac.hasRole(['superadmin'], 'editor')).toBe(true);
    expect(rbac.can(['superadmin'], 'edit_article')).toBe(true);

    // editor does NOT inherit admin
    expect(rbac.hasRole(['editor'], 'admin')).toBe(false);
  });

  it('should handle multiple roles correctly', () => {
    const rbac = new RbacEngine({
      roles: {
        billing: { permissions: ['invoices.*'] },
        support: { permissions: ['tickets.*'] },
      },
    });

    expect(rbac.can(['billing', 'support'], 'invoices.read')).toBe(true);
    expect(rbac.can(['billing', 'support'], 'tickets.write')).toBe(true);
    expect(rbac.can(['billing', 'support'], 'server.reboot')).toBe(false);
  });

  it('should handle wildcard permissions properly', () => {
    const rbac = new RbacEngine();
    rbac.addRole('manager', ['users.*', 'reports.view']);

    expect(rbac.can(['manager'], 'users.create')).toBe(true);
    expect(rbac.can(['manager'], 'users.delete')).toBe(true);
    expect(rbac.can(['manager'], 'users')).toBe(true);
    expect(rbac.can(['manager'], 'reports.view')).toBe(true);
    expect(rbac.can(['manager'], 'reports.edit')).toBe(false);
  });

  it('should resolve circular dependencies without infinite loops', () => {
    const rbac = new RbacEngine({
      roles: {
        a: { inherits: ['b'], permissions: ['perm_a'] },
        b: { inherits: ['a'], permissions: ['perm_b'] },
      },
    });

    expect(rbac.can(['a'], 'perm_b')).toBe(true);
    expect(rbac.can(['b'], 'perm_a')).toBe(true);
    expect(rbac.hasRole(['a'], 'c')).toBe(false);
  });
});
