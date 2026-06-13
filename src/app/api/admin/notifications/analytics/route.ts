import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown, buildDailyTrend } from '@/lib/admin/analytics-utils';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { isBroadcastRow } from '@/lib/notifications/broadcasts';

export async function GET() {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const [{ data: logs, error: logsError }, { data: broadcastRows, error: broadcastsError }] = await Promise.all([
    admin.from('notification_log').select('type, status, template, created_at').limit(5000),
    db.from('in_app_notifications').select('id, type, created_at, audience, recipient_user_id, metadata').limit(500),
  ]);

  if (logsError || broadcastsError) {
    return NextResponse.json({ error: 'Failed to load notification analytics' }, { status: 500 });
  }

  const rows = logs ?? [];
  const sent = rows.filter((row) => row.status === 'sent' || row.status === 'delivered');
  const failed = rows.filter((row) => row.status === 'failed');
  const broadcasts = ((broadcastRows ?? []) as Parameters<typeof isBroadcastRow>[0][]).filter(isBroadcastRow);
  const activeBroadcasts = broadcasts.filter((row) => {
    const metadata = row.metadata as { isActive?: boolean } | null;
    return metadata?.isActive !== false;
  });

  return NextResponse.json({
    summary: {
      totalLogs: rows.length,
      sentCount: sent.length,
      failedCount: failed.length,
      successRate: rows.length ? Math.round((sent.length / rows.length) * 100) : 0,
      activeBroadcasts: activeBroadcasts.length,
      totalBroadcasts: broadcasts.length,
    },
    trend: buildDailyTrend(rows.map((row) => ({ created_at: row.created_at, total: 0 })), 30),
    statusBreakdown: buildBreakdown(rows, 'status'),
    typeBreakdown: buildBreakdown(rows, 'type'),
    templateBreakdown: buildBreakdown(rows, 'template'),
  });
}
