import { createAdminClient } from '@/lib/supabase/admin';
import { logCustomerActivity } from '@/lib/customers/activity';

export const CUSTOMER_ACCOUNT_STATUSES = ['active', 'inactive', 'blocked'] as const;
export type CustomerAccountStatus = (typeof CUSTOMER_ACCOUNT_STATUSES)[number];

export const CUSTOMER_STATUS_LABELS: Record<CustomerAccountStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  blocked: 'Blocked',
};

const BLOCKED_AUTH_DURATION = '876000h';

export function isCustomerAccountAccessible(status: string | null | undefined) {
  return !status || status === 'active';
}

export function customerStatusBlockMessage(status: CustomerAccountStatus) {
  if (status === 'blocked') {
    return 'Your account has been blocked. Please contact Pure Vedic Gems support for help.';
  }
  return 'Your account is inactive. Please contact Pure Vedic Gems support to restore access.';
}

export async function getCustomerAccountStatus(customerId: string): Promise<CustomerAccountStatus> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('customer_profiles')
    .select('account_status')
    .eq('id', customerId)
    .maybeSingle();

  const status = data?.account_status;
  if (status === 'inactive' || status === 'blocked') return status;
  return 'active';
}

export async function setCustomerAccountStatus({
  customerId,
  status,
  reason,
  changedBy,
}: {
  customerId: string;
  status: CustomerAccountStatus;
  reason?: string | null;
  changedBy?: string | null;
}) {
  if (!CUSTOMER_ACCOUNT_STATUSES.includes(status)) {
    throw new Error('Invalid account status');
  }

  const admin = createAdminClient();

  const { data: teamMember } = await admin
    .from('team_members')
    .select('id')
    .eq('id', customerId)
    .maybeSingle();

  if (teamMember) {
    throw new Error('Cannot change account status for admin team members');
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin
    .from('customer_profiles')
    .update({
      account_status: status,
      status_reason: reason?.trim() || null,
      status_changed_at: now,
      status_changed_by: changedBy ?? null,
    })
    .eq('id', customerId);

  if (profileError) throw profileError;

  const { error: authError } = await admin.auth.admin.updateUserById(customerId, {
    ban_duration: status === 'active' ? 'none' : BLOCKED_AUTH_DURATION,
  });

  if (authError) throw authError;

  const actionLabel =
    status === 'active' ? 'Account activated' : status === 'inactive' ? 'Account deactivated' : 'Account blocked';

  await logCustomerActivity({
    customerId,
    eventType: 'account_status',
    title: actionLabel,
    subtitle: reason?.trim() || null,
    metadata: { status, changed_by: changedBy ?? null },
  });

  return { account_status: status, status_reason: reason?.trim() || null, status_changed_at: now };
}
