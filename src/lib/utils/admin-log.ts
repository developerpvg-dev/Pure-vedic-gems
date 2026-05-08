import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/types/database';

interface LogParams {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log an admin action to the admin_activity_log table.
 * Fire-and-forget — errors are logged but do not propagate.
 */
export async function logAdminAction({
  userId,
  action,
  resourceType,
  resourceId,
  details,
  ipAddress,
}: LogParams) {
  try {
    const supabase = createAdminClient();
    await supabase.from('admin_activity_log').insert({
      user_id: userId,
      action,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      details: (details ?? null) as Json | null,
      ip_address: ipAddress ?? null,
    });
  } catch (err) {
    console.error('[admin-log] Failed to log activity:', err);
  }
}
