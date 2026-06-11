import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { isActiveBroadcast, isBroadcastRow, type BroadcastRecord } from '@/lib/notifications/broadcasts';

export const dynamic = 'force-dynamic';

type NotificationRecord = BroadcastRecord & {
  read_at: string | null;
};

type ClientNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
  scope: 'public' | 'user';
};

function toClientNotification(row: NotificationRecord, scope: 'public' | 'user'): ClientNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    href: row.href,
    read_at: row.read_at,
    created_at: row.created_at,
    scope,
  };
}

async function fetchPublicNotifications(limit: number) {
  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db
    .from('in_app_notifications')
    .select('*')
    .eq('audience', 'user')
    .is('recipient_user_id', null)
    .order('created_at', { ascending: false })
    .limit(Math.max(limit, 50));

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('in_app_notifications')) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as NotificationRecord[])
    .filter((row) => isBroadcastRow(row) && isActiveBroadcast(row))
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? 20)));

  try {
    const publicNotifications = await fetchPublicNotifications(limit);
    const publicRows = publicNotifications.map((row) => toClientNotification(row, 'public'));

    if (!user) {
      return NextResponse.json({
        notifications: publicRows,
        unreadCount: publicRows.length,
      });
    }

    const db = asUntypedSupabase(supabase);
    const [{ data: userNotifications, error }, { count }] = await Promise.all([
      db
        .from('in_app_notifications')
        .select('*')
        .eq('audience', 'user')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit),
      db
        .from('in_app_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('audience', 'user')
        .eq('recipient_user_id', user.id)
        .is('read_at', null),
    ]);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('in_app_notifications')) {
        return NextResponse.json({ notifications: publicRows, unreadCount: publicRows.length });
      }
      console.error('[notifications] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    const userRows = ((userNotifications ?? []) as NotificationRecord[]).map((row) => toClientNotification(row, 'user'));
    const merged = [...publicRows, ...userRows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return NextResponse.json({
      notifications: merged,
      unreadCount: (count ?? 0) + publicRows.length,
    });
  } catch (error) {
    console.error('[notifications] Fetch error:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];
  const db = asUntypedSupabase(supabase);
  let query = db
    .from('in_app_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('audience', 'user')
    .eq('recipient_user_id', user.id)
    .is('read_at', null);

  if (ids.length) query = query.in('id', ids);

  const { error } = await query;
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('in_app_notifications')) {
      return NextResponse.json({ success: true });
    }
    console.error('[notifications] Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
