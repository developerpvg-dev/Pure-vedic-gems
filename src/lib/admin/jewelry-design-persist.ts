import type { SupabaseClient } from '@supabase/supabase-js';
import type { normalizeDesignPayload } from '@/lib/validators/jewelry-design';

export type JewelryDesignDbPayload = ReturnType<typeof normalizeDesignPayload>;

const OPTIONAL_COLUMNS = [
  'metal_flags',
  'product_scope',
  'rudraksha_category',
  'diamond_charges',
  'stone_addon_label',
  'labor_rates',
] as const;

type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number];

function isMissingColumnError(
  error: { code?: string; message?: string },
  column: string
): boolean {
  return error.code === 'PGRST204' && Boolean(error.message?.includes(`'${column}'`));
}

function stripMissingColumn(
  payload: Record<string, unknown>,
  column: OptionalColumn
): Record<string, unknown> {
  const next = { ...payload };
  delete next[column];
  return next;
}

export async function insertJewelryDesign(
  supabase: SupabaseClient,
  payload: JewelryDesignDbPayload
) {
  let current: Record<string, unknown> = { ...payload };
  const stripped: string[] = [];

  for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.length; attempt += 1) {
    const { data, error } = await supabase
      .from('jewelry_designs')
      .insert(current)
      .select()
      .single();

    if (!error) {
      return { data, error: null, strippedColumns: stripped };
    }

    const missing = OPTIONAL_COLUMNS.find((column) => isMissingColumnError(error, column));
    if (!missing || !(missing in current)) {
      return { data: null, error, strippedColumns: stripped };
    }

    stripped.push(missing);
    current = stripMissingColumn(current, missing);
  }

  return {
    data: null,
    error: { message: 'Failed to insert design after stripping optional columns' },
    strippedColumns: stripped,
  };
}

export async function updateJewelryDesign(
  supabase: SupabaseClient,
  id: string,
  payload: JewelryDesignDbPayload
) {
  let current: Record<string, unknown> = { ...payload };
  const stripped: string[] = [];

  for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.length; attempt += 1) {
    const { data, error } = await supabase
      .from('jewelry_designs')
      .update(current)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      return { data, error: null, strippedColumns: stripped };
    }

    const missing = OPTIONAL_COLUMNS.find((column) => isMissingColumnError(error, column));
    if (!missing || !(missing in current)) {
      return { data: null, error, strippedColumns: stripped };
    }

    stripped.push(missing);
    current = stripMissingColumn(current, missing);
  }

  return {
    data: null,
    error: { message: 'Failed to update design after stripping optional columns' },
    strippedColumns: stripped,
  };
}

export function migrationHintForStrippedColumns(stripped: string[]): string | null {
  if (stripped.length === 0) return null;
  if (stripped.includes('metal_flags')) {
    return 'Run supabase/migration_jewelry_design_metal_flags_2026.sql (or migration_jewelry_design_scope_2026.sql) in the Supabase SQL editor to enable per-metal on-request flags.';
  }
  if (stripped.includes('labor_rates')) {
    return 'Run supabase/migration_jewelry_design_labor_rates_2026.sql in the Supabase SQL editor to store labor % per design.';
  }
  return 'Some design columns are missing in the database. Run the latest jewelry_designs migrations in Supabase.';
}
