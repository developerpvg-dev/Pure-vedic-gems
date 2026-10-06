import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { hasAdminPermission } from '@/lib/admin/rbac';
import { canViewLeadMetrics } from '@/lib/leads/permissions';

/** Active telecom + astrologer roster for assignment dropdowns + metrics filters */
export async function GET() {
  const auth = await requireAdminAccess();
  if ('error' in auth) return auth.error;
  if (
    !hasAdminPermission(auth.member.role, 'leads.read', auth.member.permissions) &&
    !canViewLeadMetrics(auth.member.normalizedRole)
  ) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('team_members')
    .select('id, name, role, is_active')
    .eq('is_active', true)
    .in('role', ['telecom', 'astrologer', 'sales', 'admin', 'owner'])
    .order('name');

  if (error) return NextResponse.json({ error: 'Failed to load staff' }, { status: 500 });

  const members = data ?? [];
  return NextResponse.json({
    // ponytail: filter/assign roster is telecom-only — sales are leads managers, not callers
    telecom: members.filter((m) => m.role === 'telecom'),
    astrologers: members.filter((m) => m.role === 'astrologer'),
    managers: members.filter((m) => m.role === 'admin' || m.role === 'owner' || m.role === 'sales'),
    all: members,
  });
}
