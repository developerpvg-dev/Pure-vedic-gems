/**
 * Runnable check: npx tsx src/lib/notifications/in-app.selfcheck.ts
 * Fails loud if role scoping regresses (null role ≠ every team member).
 */
import { visibleToAdminMember } from './in-app';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(!visibleToAdminMember({ recipient_user_id: null, recipient_role: null }, 'u1', ['telecom']), 'telecom blocked from null');
assert(!visibleToAdminMember({ recipient_user_id: null, recipient_role: null }, 'u1', ['astrologer']), 'astro blocked from null');
assert(visibleToAdminMember({ recipient_user_id: null, recipient_role: null }, 'u1', ['admin']), 'admin sees null');
assert(visibleToAdminMember({ recipient_user_id: null, recipient_role: 'telecom' }, 'u1', ['telecom']), 'telecom role hit');
assert(!visibleToAdminMember({ recipient_user_id: null, recipient_role: 'sales' }, 'u1', ['telecom']), 'telecom miss sales');
assert(visibleToAdminMember({ recipient_user_id: 'u1', recipient_role: null }, 'u1', ['telecom']), 'personal hit');

console.log('in-app.selfcheck: ok');
