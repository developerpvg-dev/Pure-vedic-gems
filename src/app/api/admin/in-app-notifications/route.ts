/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { visibleToAdminMember } from '@/lib/notifications/in-app';

const DESIGNER_NOTIFICATION_TYPES = ['order_design_assigned', 'order_status_update'] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('dashboard.read');
  if ('error' in auth) return auth.error;

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? 20)));
  const db = asUntypedSupabase(createAdminClient());
  const isDesigner = auth.member.normalizedRole === 'designer';

  if (isDesigner) {
    const { data, error } = await db
      .from('in_app_notifications')
      .select('*')
      .eq('audience', 'user')
      .eq('recipient_user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('in_app_notifications')) {
        return NextResponse.json({ notifications: [], unreadCount: 0 });
      }
      console.error('[admin/in-app-notifications] Designer fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    const visible = ((data ?? []) as Array<{ type?: string; href?: string | null; read_at?: string | null }>)
      .filter((row) => {
        const type = row.type ?? '';
        const href = row.href ?? '';
        if ((DESIGNER_NOTIFICATION_TYPES as readonly string[]).includes(type)) return true;
        if (type.includes('design')) return true;
        if (href.startsWith('/admin/designer')) return true;
        return false;
      });

    return NextResponse.json({
      notifications: visible.slice(0, limit),
      unreadCount: visible.filter((row) => !row.read_at).length,
    });
  }

  const roles = [auth.member.role, auth.member.normalizedRole].filter(Boolean) as string[];

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

  type NotificationRow = {
    id: string;
    recipient_user_id: string | null;
    recipient_role: string | null;
    read_at: string | null;
  };

  const visible = ((data ?? []) as NotificationRow[]).filter((row) =>
    visibleToAdminMember(row, auth.user.id, roles)
  );
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
  const isDesigner = auth.member.normalizedRole === 'designer';

  if (isDesigner) {
    const { data } = await db
      .from('in_app_notifications')
      .select('id, type, href, read_at')
      .eq('audience', 'user')
      .eq('recipient_user_id', auth.user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    const visibleIds = ((data ?? []) as Array<{ id: string; type?: string; href?: string | null }>)
      .filter((row) => {
        const type = row.type ?? '';
        const href = row.href ?? '';
        if ((DESIGNER_NOTIFICATION_TYPES as readonly string[]).includes(type)) return true;
        if (type.includes('design')) return true;
        if (href.startsWith('/admin/designer')) return true;
        return false;
      })
      .map((row) => row.id);

    const targetIds = ids.length ? ids.filter((id: string) => visibleIds.includes(id)) : visibleIds;
    if (!targetIds.length) return NextResponse.json({ success: true });

    const { error } = await db
      .from('in_app_notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', targetIds);

    if (error) {
      console.error('[admin/in-app-notifications] Designer mark read error:', error);
      return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  const roles = [auth.member.role, auth.member.normalizedRole].filter(Boolean) as string[];

  const { data } = await db
    .from('in_app_notifications')
    .select('id, recipient_user_id, recipient_role, read_at')
    .eq('audience', 'admin')
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  type NotificationRow = {
    id: string;
    recipient_user_id: string | null;
    recipient_role: string | null;
    read_at: string | null;
  };

  const visibleIds = ((data ?? []) as NotificationRow[])
    .filter((row) => visibleToAdminMember(row, auth.user.id, roles))
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
