import type { Json } from '@/lib/types/database';
import { createAdminClient } from '@/lib/supabase/admin';

export type CustomerActivityInput = {
  customerId: string;
  eventType: string;
  title: string;
  subtitle?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function touchCustomerLastActivity(customerId: string, at = new Date().toISOString()) {
  const admin = createAdminClient();
  // ponytail: app-side bump for hosts that haven't applied DB triggers yet; rare out-of-order races are fine
  await admin
    .from('customer_profiles')
    .update({ last_activity_at: at })
    .eq('id', customerId)
    .then(null, () => undefined);
}

export async function logCustomerActivity({
  customerId,
  eventType,
  title,
  subtitle = null,
  entityType = null,
  entityId = null,
  metadata = {},
}: CustomerActivityInput) {
  const admin = createAdminClient();
  const createdAt = new Date().toISOString();
  await admin
    .from('customer_activity_log')
    .insert({
      customer_id: customerId,
      event_type: eventType,
      title,
      subtitle,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata as Json,
      created_at: createdAt,
    })
    .then(null, () => undefined);

  // Trigger also bumps this when migration is applied; keep for pre-trigger envs.
  await touchCustomerLastActivity(customerId, createdAt);
}
