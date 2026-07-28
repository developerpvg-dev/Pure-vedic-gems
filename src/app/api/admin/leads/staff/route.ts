import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

/** Active telecom + astrologer roster for assignment dropdowns */
export async function GET() {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

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
