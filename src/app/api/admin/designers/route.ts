import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

export async function GET() {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('team_members')
    .select('id, name, role, is_active')
    .eq('role', 'designer')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load designers' }, { status: 500 });
  }

  return NextResponse.json({ designers: data ?? [] });
}
