import assert from 'node:assert/strict';
import { canAccessStudio, hasAdminPermission, normalizeAdminRole, ROLE_LABELS } from './rbac';

assert.equal(normalizeAdminRole('seo_cms'), 'seo_cms');
assert.equal(ROLE_LABELS.seo_cms, 'SEO & CMS');
assert.ok(canAccessStudio('owner'));
assert.ok(canAccessStudio('admin'));
assert.ok(hasAdminPermission('seo_cms', 'products.read'));
assert.ok(hasAdminPermission('seo_cms', 'leads.read'));
assert.ok(canAccessStudio('seo_cms'));
assert.ok(canAccessStudio('content'));
assert.ok(!canAccessStudio('sales'));
assert.ok(!canAccessStudio(null));
assert.ok(!canAccessStudio('inventory'));
console.log('rbac.studio.check: ok');
