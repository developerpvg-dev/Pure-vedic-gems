/**
 * Self-check: invite accept must never reset an existing Auth user's password.
 * Run: npx tsx src/lib/admin/team-invite.selfcheck.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const acceptSrc = readFileSync(
  join(root, 'src/app/api/admin/team/invite/accept/route.ts'),
  'utf8',
);
const agentSrc = readFileSync(
  join(root, 'src/app/api/admin/agent-sessions/route.ts'),
  'utf8',
);
const migrationSrc = readFileSync(
  join(root, 'supabase/migration_revoke_jwt_admin_access_2026.sql'),
  'utf8',
);

assert.equal(
  acceptSrc.includes('updateUserById'),
  false,
  'invite accept must not call updateUserById (password takeover)',
);
assert.match(acceptSrc, /never reset password|existingAccount/);
assert.match(agentSrc, /requireAdminAccess\(['"]content\.manage['"]\)/);
assert.match(migrationSrc, /SELECT false/i);
assert.match(migrationSrc, /DROP POLICY IF EXISTS/);

console.log('ok: admin security self-check passed');
