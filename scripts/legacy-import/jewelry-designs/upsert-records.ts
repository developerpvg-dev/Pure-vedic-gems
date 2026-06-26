import type { SupabaseClient } from '@supabase/supabase-js';
import type { JewelryDesignRecord } from './sql-format';

export async function upsertJewelryDesignRecords(
  supabase: SupabaseClient,
  records: JewelryDesignRecord[]
) {
  let updated = 0;
  let inserted = 0;

  for (const record of records) {
    const { data: existing, error: lookupError } = await supabase
      .from('jewelry_designs')
      .select('id')
      .eq('name', record.name)
      .eq('setting_type', record.setting_type)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing?.id) {
      const { error } = await supabase
        .from('jewelry_designs')
        .update(record)
        .eq('id', existing.id);
      if (error) throw error;
      updated += 1;
      continue;
    }

    const { error } = await supabase.from('jewelry_designs').insert(record);
    if (error) throw error;
    inserted += 1;
  }

  return { updated, inserted };
}
