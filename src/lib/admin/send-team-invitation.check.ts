import assert from 'node:assert/strict';
import { getInviteRoles } from './send-team-invitation';

// ponytail: admin == super admin, so both may invite owner; lower roles may not
assert.ok(getInviteRoles('owner').includes('owner'));
assert.ok(getInviteRoles('admin').includes('owner'));
assert.ok(!getInviteRoles('sales').includes('owner'));
assert.ok(getInviteRoles('owner').includes('seo_cms'));
console.log('send-team-invitation.check: ok');
