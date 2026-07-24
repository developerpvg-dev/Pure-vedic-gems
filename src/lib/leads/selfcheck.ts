import { assertLeadConstants } from '@/lib/leads/constants';
import { assertRoleDashboardAllowlists } from '@/lib/admin/role-dashboards';

// ponytail: runnable integrity check for lead CRM constants + role allowlists
assertLeadConstants();
assertRoleDashboardAllowlists();
console.log('leads-crm self-check ok');
