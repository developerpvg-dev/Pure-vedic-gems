/**
 * Self-check: admin MFA wiring stays in place.
 * Run: npx tsx src/lib/admin/mfa.selfcheck.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

assert.match(read('src/lib/admin/api.ts'), /hasValidAdminMfaForUser/);
assert.match(read('src/proxy-auth.ts'), /hasValidAdminMfaCookie/);
assert.match(read('src/proxy-auth.ts'), /admin-mfa\/challenge/);
assert.match(read('src/lib/hooks/useAuth.tsx'), /requiresAdminOtp/);
assert.match(read('src/lib/admin/mfa.ts'), /verifyFixedInventoryOtp/);
assert.match(read('src/lib/admin/mfa-start.ts'), /isAdminFixedOtpRole/);
assert.match(read('src/lib/admin/mfa-start.ts'), /mode: 'fixed'/);
assert.match(read('src/lib/admin/mfa-start.ts'), /email_otp/);
assert.match(read('src/lib/resend/send-admin-mfa-otp.ts'), /admin verification code/i);
assert.match(read('src/app/api/auth/admin-mfa/verify/route.ts'), /verifyFixedInventoryOtp/);
assert.match(read('src/app/api/auth/admin-mfa/verify/route.ts'), /verifyOtp/);
assert.match(read('src/app/api/auth/login/route.ts'), /requiresAdminOtp/);
assert.match(read('src/app/auth/callback/route.ts'), /admin-mfa\/challenge/);
assert.equal(read('src/app/api/auth/admin-mfa/verify/route.ts').includes("type: 'email'"), true);

console.log('ok: admin MFA self-check passed');
