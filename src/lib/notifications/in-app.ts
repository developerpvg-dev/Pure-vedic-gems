import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

export type NotificationAudience = 'user' | 'admin';

export type InAppNotificationInput = {
  audience: NotificationAudience;
  type: string;
  title: string;
  message: string;
  href?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  recipientUserId?: string | null;
  recipientRole?: string | null;
};

function toPayload(input: InAppNotificationInput) {
  return {
    audience: input.audience,
    type: input.type,
    title: input.title,
    message: input.message,
    href: input.href ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
    recipient_user_id: input.recipientUserId ?? null,
    recipient_role: input.recipientRole ?? null,
  };
}

export async function createInAppNotification(input: InAppNotificationInput) {
  const db = asUntypedSupabase(createAdminClient());
  const { error } = await db.from('in_app_notifications').insert(toPayload(input));

  if (error) {
    console.error('[in-app-notifications] Create error:', error);
  }
}

export async function createInAppNotifications(inputs: InAppNotificationInput[]) {
  if (!inputs.length) return;
  const db = asUntypedSupabase(createAdminClient());
  const { error } = await db.from('in_app_notifications').insert(inputs.map(toPayload));

  if (error) {
    console.error('[in-app-notifications] Bulk create error:', error);
  }
}

export async function notifyUser(input: Omit<InAppNotificationInput, 'audience' | 'recipientRole'> & { recipientUserId: string }) {
  await createInAppNotification({ ...input, audience: 'user' });
}

export async function notifyAdmins(input: Omit<InAppNotificationInput, 'audience' | 'recipientUserId'>) {
  await createInAppNotification({ ...input, audience: 'admin' });
}