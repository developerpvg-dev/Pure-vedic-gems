import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { isActiveBroadcast, isBroadcastRow, type BroadcastRecord } from '@/lib/notifications/broadcasts';

export const dynamic = 'force-dynamic';

const PUBLIC_CACHE_MS = process.env.NODE_ENV === 'development' ? 60_000 : 120_000;
const PUBLIC_FAILURE_CACHE_MS = 60_000;
const AUTH_TIMEOUT_MS = 2_000;

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

type PublicNotificationsPayload = {
  rows: NotificationRecord[];
};

let publicNotificationsCache: { expiresAt: number; payload: PublicNotificationsPayload } | null = null;
let publicNotificationsFailureUntil = 0;
let publicNotificationsInflight: Promise<PublicNotificationsPayload> | null = null;
let lastPublicFailureLogAt = 0;

function isSupabaseUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const details =
    error && typeof error === 'object' && 'details' in error
      ? String((error as { details?: string }).details ?? '')
      : '';
  const combined = `${message}\n${details}`;
  return (
    combined.includes('AbortError') ||
    combined.includes('Headers Timeout') ||
    combined.includes('UND_ERR_HEADERS_TIMEOUT') ||
    combined.includes('fetch failed')
  );
}

function logPublicNotificationsFailure(error: unknown) {
  if (Date.now() - lastPublicFailureLogAt < PUBLIC_FAILURE_CACHE_MS) return;
  lastPublicFailureLogAt = Date.now();
  if (isSupabaseUnavailableError(error)) {
    console.warn('[notifications] Supabase unavailable, serving empty public notifications');
    return;
  }
  console.error('[notifications] Fetch error:', error);
}

function readPublicNotificationsCache(limit: number): NotificationRecord[] | null {
  if (!publicNotificationsCache || Date.now() > publicNotificationsCache.expiresAt) return null;
  return publicNotificationsCache.payload.rows.slice(0, limit);
}

function writePublicNotificationsCache(rows: NotificationRecord[]) {
  publicNotificationsCache = {
    expiresAt: Date.now() + PUBLIC_CACHE_MS,
    payload: { rows },
  };
  publicNotificationsFailureUntil = 0;
}

function isPublicNotificationsFailureCached() {
  return publicNotificationsFailureUntil > Date.now();
}

function markPublicNotificationsFailure() {
  publicNotificationsFailureUntil = Date.now() + PUBLIC_FAILURE_CACHE_MS;
}

async function queryPublicNotifications(limit: number): Promise<NotificationRecord[]> {
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

async function loadPublicNotifications(limit: number): Promise<NotificationRecord[]> {
  const cached = readPublicNotificationsCache(limit);
  if (cached) return cached;

  if (isPublicNotificationsFailureCached()) {
    return [];
  }

  if (!publicNotificationsInflight) {
    publicNotificationsInflight = queryPublicNotifications(Math.max(limit, 50))
      .then((rows) => ({ rows }))
      .finally(() => {
        publicNotificationsInflight = null;
      });
  }

  try {
    const payload = await publicNotificationsInflight;
    writePublicNotificationsCache(payload.rows);
    return payload.rows.slice(0, limit);
  } catch (error) {
    markPublicNotificationsFailure();
    logPublicNotificationsFailure(error);
    return [];
  }
}

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

async function resolveCurrentUser() {
  const supabase = await createClient();
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth lookup timed out')), AUTH_TIMEOUT_MS)
      ),
    ]);
    return { supabase, user: result.data.user };
  } catch {
    return { supabase, user: null };
  }
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await resolveCurrentUser();

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? 20)));

  try {
    const publicNotifications = await loadPublicNotifications(limit);
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
      logPublicNotificationsFailure(error);
      return NextResponse.json({ notifications: publicRows, unreadCount: publicRows.length });
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
    logPublicNotificationsFailure(error);
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
