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
    })
    .then(null, () => undefined);
}
