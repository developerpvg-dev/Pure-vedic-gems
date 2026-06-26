import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseJewelrySettingProfilesFromCommerce } from '@/lib/utils/jewelry-setting-metal-profiles';

/** Public read of ring / pendant / bracelet metal labor & GST profiles. */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('commerce_settings')
      .select('values')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[jewelry/setting-profiles] load error:', error);
      return NextResponse.json({ profiles: {} });
    }

    const values = ((data as { values?: unknown } | null)?.values ?? {}) as Record<
      string,
      unknown
    >;
    return NextResponse.json({
      profiles: parseJewelrySettingProfilesFromCommerce(values),
    });
  } catch {
    return NextResponse.json({ profiles: {} });
  }
}
