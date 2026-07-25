import { assertLeadConstants } from '@/lib/leads/constants';
import { assertHydrateParse } from '@/lib/leads/hydrate';
import { assertRoleDashboardAllowlists } from '@/lib/admin/role-dashboards';

assertLeadConstants();
assertHydrateParse();
assertRoleDashboardAllowlists();

// Rs 101 vs detailed consultation classification
function isRs101(planId: string | null, title: string, amount: number) {
  const t = title.toLowerCase();
  return planId == null && (t.includes('gem recommendation') || amount === 101);
}
if (!isRs101(null, 'Gem Recommendation', 101)) throw new Error('rs101 classify');
if (isRs101('uuid', 'Full Chart', 2100)) throw new Error('detailed must not be rs101');

console.log('leads-crm self-check ok');
