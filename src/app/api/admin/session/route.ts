import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { hasAdminPermission } from '@/lib/admin/rbac';

export async function GET() {
  const auth = await requireAdminAccess();
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: memberRaw } = await db
    .from('team_members')
    .select('name, role, avatar_url')
    .eq('id', auth.user.id)
    .maybeSingle();

  const member = memberRaw as { name: string; role: string; avatar_url?: string | null } | null;

  return NextResponse.json({
    role: auth.member.normalizedRole,
    name: member?.name ?? auth.member.name,
    email: auth.user.email ?? null,
    avatar_url: member?.avatar_url ?? null,
    canWriteOrders: hasAdminPermission(auth.member.role, 'orders.write', auth.member.permissions),
  });
}
