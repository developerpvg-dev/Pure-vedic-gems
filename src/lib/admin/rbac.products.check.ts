import assert from 'node:assert/strict';
import { getAdminRoutePermission, hasAdminPermission, normalizeAdminRole } from './rbac';

const PRODUCT_PERMS = ['products.read', 'products.write', 'products.delete', 'imports.write'] as const;

for (const role of ['inventory', 'content'] as const) {
  for (const perm of PRODUCT_PERMS) {
    assert.ok(hasAdminPermission(role, perm), `${role} must have ${perm}`);
  }
}

assert.equal(normalizeAdminRole('product_upload'), 'inventory');
assert.equal(normalizeAdminRole('website_maintenance'), 'content');

// Website Maintenance: full Lab Logos (upload + assign to products)
assert.equal(getAdminRoutePermission('/admin/lab-logos'), 'content.manage');
assert.ok(hasAdminPermission('content', 'content.manage'), 'content must open /admin/lab-logos');
assert.ok(hasAdminPermission('content', 'products.write'), 'content must assign lab logos to products');
assert.ok(hasAdminPermission('content', 'products.read'), 'content must search products for lab logo assign');

console.log('rbac.products.check: ok');
