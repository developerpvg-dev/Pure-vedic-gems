import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import type { NotificationLog } from '@/lib/types/database';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { data: sourceLogData, error: sourceError } = await admin
    .from('notification_log')
    .select('*')
    .eq('id', id)
    .single();

  if (sourceError || !sourceLogData) return NextResponse.json({ error: 'Notification log not found' }, { status: 404 });
  const sourceLog = sourceLogData as NotificationLog;

  const { data: retryLogData, error } = await admin
    .from('notification_log')
    .insert({
      type: sourceLog.type,
      recipient: sourceLog.recipient,
      template: sourceLog.template,
      context: {
        ...(sourceLog.context && typeof sourceLog.context === 'object' && !Array.isArray(sourceLog.context) ? sourceLog.context : {}),
        retry_of: sourceLog.id,
        queued_by: auth.user.id,
      },
      status: 'queued',
      error_message: null,
    })
    .select('*')
    .single();

  if (error || !retryLogData) return NextResponse.json({ error: 'Failed to queue retry' }, { status: 500 });
  const retryLog = retryLogData as NotificationLog;

  void logAdminAction({ userId: auth.user.id, action: 'notification_retry_queued', resourceType: 'notification_log', resourceId: id, details: { retry_id: retryLog.id } });
  return NextResponse.json({ log: retryLog }, { status: 201 });
}