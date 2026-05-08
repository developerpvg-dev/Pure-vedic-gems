import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  notificationPreferencesSchema,
  parseNotificationPreferences,
  serializeNotificationPreferences,
} from '@/lib/customer/notification-preferences';
import type { CustomerPreference } from '@/lib/types/database';

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  return { supabase, user };
}

export async function GET() {
  const auth = await getUser();
  if ('error' in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from('customer_preferences')
    .select('customer_id, notification_preferences, updated_at')
    .eq('customer_id', auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ preferences: DEFAULT_NOTIFICATION_PREFERENCES, storage_available: false });
  }

  const row = data as Pick<CustomerPreference, 'customer_id' | 'notification_preferences' | 'updated_at'> | null;
  return NextResponse.json({ preferences: parseNotificationPreferences(row?.notification_preferences), storage_available: true });
}

export async function PUT(request: NextRequest) {
  const auth = await getUser();
  if ('error' in auth) return auth.error;

  const parsed = notificationPreferencesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid preference payload', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const preferences = {
    ...parsed.data,
    consent_updated_at: new Date().toISOString(),
  };

  const { error } = await auth.supabase
    .from('customer_preferences')
    .upsert({
      customer_id: auth.user.id,
      notification_preferences: serializeNotificationPreferences(preferences),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'customer_id' });

  if (error) {
    return NextResponse.json({ error: 'Preference storage migration is pending' }, { status: 503 });
  }

  return NextResponse.json({ preferences });
}