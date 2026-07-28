import { assertLeadConstants } from '@/lib/leads/constants';
import { assertHydrateParse } from '@/lib/leads/hydrate';
import { assertRoleDashboardAllowlists } from '@/lib/admin/role-dashboards';
import {
  canMarkConverted,
  canMarkNotConverted,
  isLeadManager,
} from '@/lib/leads/permissions';

assertLeadConstants();
assertHydrateParse();
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

console.log('leads-crm self-check ok');
