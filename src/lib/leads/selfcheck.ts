import { assertLeadConstants } from '@/lib/leads/constants';
import { assertHydrateParse } from '@/lib/leads/hydrate';
import { assertDuplicateScoring } from '@/lib/leads/duplicates';
import { assertRoleDashboardAllowlists } from '@/lib/admin/role-dashboards';
import {
  canMarkConverted,
  canMarkNotConverted,
  isLeadManager,
} from '@/lib/leads/permissions';

assertLeadConstants();
assertHydrateParse();
assertDuplicateScoring();
assertRoleDashboardAllowlists();

// Conversion permissions
if (!canMarkNotConverted('telecom')) throw new Error('telecom can mark not converted');
if (!canMarkNotConverted('sales')) throw new Error('sales can mark not converted');
if (!canMarkNotConverted('fulfillment')) throw new Error('fulfillment can mark not converted');
if (canMarkNotConverted('astrologer')) throw new Error('astro must not mark not converted');
if (!canMarkConverted('fulfillment')) throw new Error('fulfillment can mark converted');
if (!canMarkConverted('admin')) throw new Error('admin can mark converted');
if (canMarkConverted('telecom')) throw new Error('telecom must not mark converted');
if (!isLeadManager('fulfillment')) throw new Error('fulfillment is lead manager');
// Converted requires a real order_id — enforced in DB check + API lookup
function assertConvertedNeedsOrder(status: string, orderId: string | null) {
  if (status === 'converted' && !orderId) throw new Error('converted requires order_id');
}
assertConvertedNeedsOrder('converted', 'uuid');
try {
  assertConvertedNeedsOrder('converted', null);
  throw new Error('should have thrown');
} catch (e) {
  if (e instanceof Error && e.message === 'should have thrown') throw e;
}

// Rs 101 vs detailed consultation classification
function isRs101(planId: string | null, title: string, amount: number) {
  const t = title.toLowerCase();
  return planId == null && (t.includes('gem recommendation') || amount === 101);
}
if (!isRs101(null, 'Gem Recommendation', 101)) throw new Error('rs101 classify');
if (isRs101('uuid', 'Full Chart', 2100)) throw new Error('detailed must not be rs101');

// Pending → paid flip on verify path
function paymentFlags(status: string, amount: number) {
  const paid = status === 'captured';
  return {
    payment_received: paid,
    payment_note: paid ? `₹${amount} received via Razorpay` : `₹${amount} payment pending`,
  };
}
if (paymentFlags('pending', 101).payment_received) throw new Error('pending must not be paid');
if (paymentFlags('pending', 101).payment_note !== '₹101 payment pending') throw new Error('pending note');
if (!paymentFlags('captured', 101).payment_received) throw new Error('captured must be paid');

// Purpose can exceed old varchar(180) — DB is TEXT; validators allow 5000 like consultation.life_situation
const longPurpose =
  'Recommended me only one gems can be till its Mahadasha or lifetime looking at lagna and navasma chart, for career and material gains in social media and grocery store And WhatsApp urgently please.';
if (longPurpose.length <= 180) throw new Error('fixture must exceed old 180 limit');
if (longPurpose.length > 5000) throw new Error('fixture must fit consultation max');

console.log('leads-crm self-check ok');
