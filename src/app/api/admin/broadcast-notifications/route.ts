import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyPublic } from '@/lib/notifications/in-app';
import {
  getBroadcastMetadata,
  isBroadcastRow,
  toBroadcastView,
  type BroadcastRecord,
} from '@/lib/notifications/broadcasts';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

export const dynamic = 'force-dynamic';

async function fetchBroadcastRows(limit: number) {
  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db
    .from('in_app_notifications')
    .select('id, type, title, message, href, created_at, audience, recipient_user_id, metadata')
    .eq('audience', 'user')
    .is('recipient_user_id', null)
    .order('created_at', { ascending: false })
    .limit(Math.max(limit, 100));

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('in_app_notifications')) {
      return { rows: [] as BroadcastRecord[], error: null };
    }
    return { rows: [] as BroadcastRecord[], error };
  }

  const rows = ((data ?? []) as BroadcastRecord[]).filter(isBroadcastRow);
  return { rows, error: null };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? 50)));
  const { rows, error } = await fetchBroadcastRows(limit);

  if (error) {
    console.error('[admin/broadcast-notifications] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
  }

  return NextResponse.json({
    broadcasts: rows.slice(0, limit).map(toBroadcastView),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const href = typeof body.href === 'string' && body.href.trim() ? body.href.trim() : null;
  const type = typeof body.type === 'string' && body.type.trim() ? body.type.trim() : 'announcement';
  const expiresAt = typeof body.expiresAt === 'string' && body.expiresAt.trim() ? body.expiresAt.trim() : null;

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
  }

  const result = await notifyPublic({
    type,
    title: title.slice(0, 180),
    message,
    href,
    expiresAt,
    metadata: {
      created_by: auth.user.id,
      created_by_email: auth.user.email ?? null,
    },
  });

  if (result.error) {
    console.error('[admin/broadcast-notifications] Create error:', result.error);
    return NextResponse.json({ error: 'Failed to send broadcast notification' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const isActive = typeof body.isActive === 'boolean' ? body.isActive : null;

  if (!id || isActive == null) {
    return NextResponse.json({ error: 'id and isActive are required' }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const { data: existing, error: fetchError } = await db
    .from('in_app_notifications')
    .select('id, metadata, audience, recipient_user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !existing || !isBroadcastRow(existing as BroadcastRecord)) {
    return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
  }

  const metadata = {
    ...getBroadcastMetadata(existing as BroadcastRecord),
    is_active: isActive,
  };

  const { error } = await db
    .from('in_app_notifications')
    .update({ metadata })
    .eq('id', id);

  if (error) {
    console.error('[admin/broadcast-notifications] Update error:', error);
    return NextResponse.json({ error: 'Failed to update broadcast' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
