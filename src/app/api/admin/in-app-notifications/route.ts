import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

export const dynamic = 'force-dynamic';

type NotificationRow = {
  id: string;
  recipient_user_id: string | null;
  recipient_role: string | null;
  read_at: string | null;
};

function visibleToAdmin(row: NotificationRow, userId: string, roles: string[]) {
  const userMatches = !row.recipient_user_id || row.recipient_user_id === userId;
  const roleMatches = !row.recipient_role || roles.includes(row.recipient_role);
  return userMatches && roleMatches;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('dashboard.read');
  if ('error' in auth) return auth.error;

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? 20)));
  const db = asUntypedSupabase(createAdminClient());
  const roles = [auth.member.role, auth.member.normalizedRole].filter(Boolean);

  const { data, error } = await db
    .from('in_app_notifications')
    .select('*')
    .eq('audience', 'admin')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('in_app_notifications')) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }
    console.error('[admin/in-app-notifications] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  const visible = ((data ?? []) as NotificationRow[]).filter((row) => visibleToAdmin(row, auth.user.id, roles));
  return NextResponse.json({
    notifications: visible.slice(0, limit),
    unreadCount: visible.filter((row) => !row.read_at).length,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess('dashboard.read');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];
  const db = asUntypedSupabase(createAdminClient());
  const roles = [auth.member.role, auth.member.normalizedRole].filter(Boolean);

  const { data } = await db
    .from('in_app_notifications')
    .select('id, recipient_user_id, recipient_role, read_at')
    .eq('audience', 'admin')
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  const visibleIds = ((data ?? []) as NotificationRow[])
    .filter((row) => visibleToAdmin(row, auth.user.id, roles))
    .map((row) => row.id);
  const targetIds = ids.length ? ids.filter((id: string) => visibleIds.includes(id)) : visibleIds;

  if (!targetIds.length) return NextResponse.json({ success: true });

  const { error } = await db
    .from('in_app_notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', targetIds);

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('in_app_notifications')) {
      return NextResponse.json({ success: true });
    }
    console.error('[admin/in-app-notifications] Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}