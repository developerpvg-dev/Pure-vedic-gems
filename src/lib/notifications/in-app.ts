import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { buildBroadcastMetadata } from '@/lib/notifications/broadcasts';

export type NotificationAudience = 'user' | 'admin' | 'public';

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
  isActive?: boolean;
  expiresAt?: string | null;
};

/** Untagged admin alerts (null recipient_role) — never telecaller / astrologer / designer. */
const LEGACY_ADMIN_BROADCAST_ROLES = new Set([
  'owner',
  'admin',
  'sales',
  'stock_manager',
  'fulfillment',
  'finance',
]);

/** Who may see an admin in-app row. Role-targeted and user-targeted only; null role ≠ everyone. */
export function visibleToAdminMember(
  row: { recipient_user_id: string | null; recipient_role: string | null },
  userId: string,
  roleList: string[]
) {
  if (row.recipient_user_id) return row.recipient_user_id === userId;
  if (row.recipient_role) return roleList.includes(row.recipient_role);
  return roleList.some((r) => LEGACY_ADMIN_BROADCAST_ROLES.has(r));
}

function toPayload(input: InAppNotificationInput) {
  return {
    audience: input.audience === 'public' ? 'user' : input.audience,
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
    return { error };
  }

  return { error: null };
}

export async function createInAppNotifications(inputs: InAppNotificationInput[]) {
  if (!inputs.length) return { error: null };
  const db = asUntypedSupabase(createAdminClient());
  const { error } = await db.from('in_app_notifications').insert(inputs.map(toPayload));

  if (error) {
    console.error('[in-app-notifications] Bulk create error:', error);
    return { error };
  }

  return { error: null };
}

export async function notifyUser(input: Omit<InAppNotificationInput, 'audience' | 'recipientRole'> & { recipientUserId: string }) {
  return createInAppNotification({ ...input, audience: 'user' });
}

export async function notifyAdmins(input: Omit<InAppNotificationInput, 'audience' | 'recipientUserId'>) {
  return createInAppNotification({ ...input, audience: 'admin' });
}

export async function notifyPublic(input: Omit<InAppNotificationInput, 'audience' | 'recipientUserId' | 'recipientRole'>) {
  return createInAppNotification({
    ...input,
    audience: 'user',
    recipientUserId: null,
    recipientRole: null,
    metadata: buildBroadcastMetadata({
      expiresAt: input.expiresAt ?? null,
      isActive: input.isActive ?? true,
      metadata: input.metadata,
    }),
  });
}
