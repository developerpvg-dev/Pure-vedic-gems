import { z } from 'zod';
import type { Json } from '@/lib/types/database';

export const notificationPreferencesSchema = z.object({
  email_order_updates: z.boolean().default(true),
  email_review_requests: z.boolean().default(true),
  email_guides: z.boolean().default(true),
  email_offers: z.boolean().default(false),
  whatsapp_order_updates: z.boolean().default(true),
  whatsapp_consultation: z.boolean().default(true),
  wishlist_price_drop: z.boolean().default(false),
  wishlist_back_in_stock: z.boolean().default(false),
  consent_marketing: z.boolean().default(false),
  consent_updated_at: z.string().nullable().optional(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_order_updates: true,
  email_review_requests: true,
  email_guides: true,
  email_offers: false,
  whatsapp_order_updates: true,
  whatsapp_consultation: true,
  wishlist_price_drop: false,
  wishlist_back_in_stock: false,
  consent_marketing: false,
  consent_updated_at: null,
};

export function parseNotificationPreferences(value: Json | null | undefined): NotificationPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_NOTIFICATION_PREFERENCES;
  return notificationPreferencesSchema.parse({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...value });
}

export function serializeNotificationPreferences(value: NotificationPreferences): Json {
  return notificationPreferencesSchema.parse(value) as unknown as Json;
}