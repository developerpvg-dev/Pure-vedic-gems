/**
 * Helpers for reading product configuration snapshots stored on
 * product_configurations and order line items.
 */

export interface ConfigurationSnapshotEnergizationForm {
  dob: string;
  gotra: string;
  rashi: string;
  record_ceremony?: boolean;
}

export interface ConfigurationSnapshot {
  version?: number;
  product?: {
    id?: string;
    sku?: string | null;
    tag_number?: string | null;
    name?: string;
    category?: string;
    sub_category?: string | null;
    image_url?: string | null;
    carat_weight?: number | null;
    origin?: string | null;
  };
  selections?: {
    setting_type?: string | null;
    design?: { id?: string; name?: string } | null;
    custom_design_url?: string | null;
    metal?: string | null;
    ring_size?: string | null;
    chain_length?: string | null;
    certification?: { id?: string; name?: string } | null;
    certification_skipped?: boolean;
    energization?: { id?: string; name?: string } | null;
    energization_form?: ConfigurationSnapshotEnergizationForm | null;
  };
  pricing?: {
    gem_price?: number;
    making_charge?: number;
    diamond_charge?: number;
    stone_addon_label?: string | null;
    design_note?: string | null;
    metal_price?: number;
    metal_weight_grams?: number;
    gold_rate_per_gram?: number;
    certification_fee?: number;
    energization_fee?: number;
    custom_design_fee?: number;
    total?: number;
  };
  delivery_eta?: {
    min_days?: number;
    max_days?: number;
    label?: string;
  };
  summary?: string;
}

export function parseConfigurationSnapshot(
  value: unknown
): ConfigurationSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as ConfigurationSnapshot;
}

export function mergeConfigurationDetails(args: {
  snapshot?: unknown;
  dbConfig?: {
    setting_type?: string | null;
    metal?: string | null;
    ring_size?: string | null;
    chain_length?: string | null;
    custom_design_url?: string | null;
    gem_price?: number | null;
    making_charge?: number | null;
    metal_price?: number | null;
    metal_weight_grams?: number | null;
    gold_rate_per_gram?: number | null;
    certification_fee?: number | null;
    energization_fee?: number | null;
    total_price?: number | null;
    jewelry_designs?: { name: string; setting_type: string; image_url: string | null; description: string | null } | null;
    certification_labs?: { name: string; full_name: string | null } | null;
    energization_options?: { name: string; description: string | null; duration: string | null } | null;
  } | null;
}): ConfigurationSnapshot {
  const parsed = parseConfigurationSnapshot(args.snapshot) ?? {};
  const db = args.dbConfig;

  return {
    ...parsed,
    selections: {
      setting_type: parsed.selections?.setting_type ?? db?.setting_type ?? null,
      design: parsed.selections?.design ?? (db?.jewelry_designs
        ? { name: db.jewelry_designs.name }
        : null),
      custom_design_url:
        parsed.selections?.custom_design_url ?? db?.custom_design_url ?? null,
      metal: parsed.selections?.metal ?? db?.metal ?? null,
      ring_size: parsed.selections?.ring_size ?? db?.ring_size ?? null,
      chain_length: parsed.selections?.chain_length ?? db?.chain_length ?? null,
      certification:
        parsed.selections?.certification ??
        (db?.certification_labs ? { name: db.certification_labs.name } : null),
      certification_skipped: parsed.selections?.certification_skipped,
      energization:
        parsed.selections?.energization ??
        (db?.energization_options ? { name: db.energization_options.name } : null),
      energization_form: parsed.selections?.energization_form ?? null,
    },
    pricing: {
      gem_price: parsed.pricing?.gem_price ?? db?.gem_price ?? undefined,
      making_charge: parsed.pricing?.making_charge ?? db?.making_charge ?? undefined,
      diamond_charge: parsed.pricing?.diamond_charge,
      stone_addon_label: parsed.pricing?.stone_addon_label,
      design_note: parsed.pricing?.design_note,
      metal_price: parsed.pricing?.metal_price ?? db?.metal_price ?? undefined,
      metal_weight_grams:
        parsed.pricing?.metal_weight_grams ?? db?.metal_weight_grams ?? undefined,
      gold_rate_per_gram:
        parsed.pricing?.gold_rate_per_gram ?? db?.gold_rate_per_gram ?? undefined,
      certification_fee:
        parsed.pricing?.certification_fee ?? db?.certification_fee ?? undefined,
      energization_fee:
        parsed.pricing?.energization_fee ?? db?.energization_fee ?? undefined,
      custom_design_fee: parsed.pricing?.custom_design_fee,
      total: parsed.pricing?.total ?? db?.total_price ?? undefined,
    },
    delivery_eta: parsed.delivery_eta,
    summary: parsed.summary,
  };
}
