import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ notifications: [], unreadCount: 0 });

  const db = asUntypedSupabase(supabase);
  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? 20)));

  const [{ data: notifications, error }, { count }] = await Promise.all([
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
    // PGRST205 = table not found (migration not yet applied)
    if (error.code === 'PGRST205' || error.message?.includes('in_app_notifications')) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }
    console.error('[notifications] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  return NextResponse.json({ notifications: notifications ?? [], unreadCount: count ?? 0 });
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