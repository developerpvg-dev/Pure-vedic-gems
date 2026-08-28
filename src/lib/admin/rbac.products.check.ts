import assert from 'node:assert/strict';
import { hasAdminPermission, normalizeAdminRole } from './rbac';

const PRODUCT_PERMS = ['products.read', 'products.write', 'products.delete', 'imports.write'] as const;

for (const role of ['inventory', 'content'] as const) {
  for (const perm of PRODUCT_PERMS) {
    assert.ok(hasAdminPermission(role, perm), `${role} must have ${perm}`);
  }
}

assert.equal(normalizeAdminRole('product_upload'), 'inventory');
assert.equal(normalizeAdminRole('website_maintenance'), 'content');

console.log('rbac.products.check: ok');
