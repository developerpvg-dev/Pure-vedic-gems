/**
 * Public shareable design catalog URLs — derived from jewelry_designs name + scope.
 * No slug column: WP used /designs_set/design-N; we keep the same slug shape.
 */

import { createOptionalPublicClient } from '@/lib/supabase/public';
import type { JewelryDesign } from '@/lib/types/database';

export const DESIGN_CATALOG_KINDS = ['ring', 'pendant', 'bracelet', 'rudraksha'] as const;
export type DesignCatalogKind = (typeof DESIGN_CATALOG_KINDS)[number];

export const DESIGN_CATALOG_META: Record<
  DesignCatalogKind,
  { label: string; plural: string; blurb: string }
> = {
  ring: {
    label: 'Ring',
    plural: 'Ring designs',
    blurb: 'Custom gemstone ring settings from the Pure Vedic Gems configurator.',
  },
  pendant: {
    label: 'Pendant',
    plural: 'Pendant designs',
    blurb: 'Gemstone pendant mountings you can configure with certified stones.',
  },
  bracelet: {
    label: 'Bracelet',
    plural: 'Bracelet designs',
    blurb: 'Bracelet settings for Vedic gemstones, built to order.',
  },
  rudraksha: {
    label: 'Rudraksha',
    plural: 'Rudraksha designs',
    blurb: 'Rudraksha mounting designs for one mukhi through multi-bead combinations.',
  },
};

export function isDesignCatalogKind(value: string): value is DesignCatalogKind {
  return (DESIGN_CATALOG_KINDS as readonly string[]).includes(value);
}

export function designSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function designCatalogKind(design: {
  setting_type: string;
  product_scope?: string | null;
}): DesignCatalogKind | null {
  if (design.product_scope === 'rudraksha') return 'rudraksha';
  if (isDesignCatalogKind(design.setting_type) && design.setting_type !== 'rudraksha') {
    return design.setting_type;
  }
  return null;
}

export function designHref(design: {
  name: string;
  setting_type: string;
  product_scope?: string | null;
}): string | null {
  const kind = designCatalogKind(design);
  if (!kind) return null;
  return `/designs/${kind}/${designSlug(design.name)}`;
}

export function designHrefForKind(kind: DesignCatalogKind, name: string): string {
  return `/designs/${kind}/${designSlug(name)}`;
}

/** Configurator setting_type for a catalog kind (rudraksha mountings use pendant). */
export function settingTypeForCatalogKind(kind: DesignCatalogKind): 'ring' | 'pendant' | 'bracelet' {
  return kind === 'rudraksha' ? 'pendant' : kind;
}

export function configureHrefForDesign(designId: string, kind: DesignCatalogKind): string {
  const setting = settingTypeForCatalogKind(kind);
  return `/configure?design=${encodeURIComponent(designId)}&setting=${setting}`;
}

type PublicDesignRow = Pick<
  JewelryDesign,
  | 'id'
  | 'name'
  | 'setting_type'
  | 'image_url'
  | 'video_url'
  | 'description'
  | 'product_scope'
  | 'rudraksha_category'
  | 'sort_order'
  | 'is_active'
>;

export type PublicDesignDetail = PublicDesignRow &
  Pick<
    JewelryDesign,
    | 'making_charges'
    | 'estimated_metal_weight'
    | 'diamond_charges'
    | 'metal_flags'
    | 'labor_rates'
    | 'stone_addon_label'
  >;

const LIST_COLS =
  'id, name, setting_type, image_url, video_url, description, product_scope, rudraksha_category, sort_order, is_active';

const DETAIL_COLS = `${LIST_COLS}, making_charges, estimated_metal_weight, diamond_charges, metal_flags, labor_rates, stone_addon_label`;

function applyKindFilter<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  kind: DesignCatalogKind
): T {
  return kind === 'rudraksha'
    ? query.eq('product_scope', 'rudraksha')
    : query.eq('setting_type', kind).eq('product_scope', 'gemstone');
}

export async function listPublicDesigns(kind: DesignCatalogKind): Promise<PublicDesignRow[]> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];

  let query = supabase
    .from('jewelry_designs')
    .select(LIST_COLS)
    .eq('is_active', true)
    .eq('is_custom', false)
    .order('sort_order', { ascending: true });

  query = applyKindFilter(query, kind);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as PublicDesignRow[];
}

export async function getPublicDesignBySlug(
  kind: DesignCatalogKind,
  slug: string
): Promise<PublicDesignDetail | null> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return null;

  let query = supabase
    .from('jewelry_designs')
    .select(DETAIL_COLS)
    .eq('is_active', true)
    .eq('is_custom', false)
    .order('sort_order', { ascending: true });

  query = applyKindFilter(query, kind);

  const { data, error } = await query;
  if (error || !data) return null;
  const rows = data as PublicDesignDetail[];
  return rows.find((d) => designSlug(d.name) === slug) ?? null;
}

export async function listAllPublicDesigns(): Promise<PublicDesignRow[]> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('jewelry_designs')
    .select(LIST_COLS)
    .eq('is_active', true)
    .eq('is_custom', false)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data as PublicDesignRow[];
}
