import type { SupabaseClient } from '@supabase/supabase-js';
import { collectRudrakshaSampleThumbs } from '@/lib/constants/rudraksha-category-images';

/** First product thumbnail per rudraksha sub_category — same source as /shop/rudraksha. */
export async function loadRudrakshaSampleThumbs(
  supabase: SupabaseClient,
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from('products')
    .select('sub_category, thumbnail_url')
    .eq('category', 'rudraksha')
    .eq('is_active', true)
    .not('thumbnail_url', 'is', null)
    .order('created_at', { ascending: false });

  return collectRudrakshaSampleThumbs(data ?? []);
}
