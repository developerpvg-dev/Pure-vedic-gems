import type { Json } from '@/lib/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface OrderLineItem {
  product_id?: string | null;
  name?: string | null;
  sku?: string | null;
  tag_number?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  line_total?: number | null;
  carat_weight?: number | null;
  origin?: string | null;
  image_url?: string | null;
  category?: string | null;
  configuration_id?: string | null;
  configuration_summary?: string | null;
  configuration_snapshot?: unknown;
  delivery_eta_label?: string | null;
}

export function parseOrderItems(value: Json): OrderLineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    .map((item) => item as unknown as OrderLineItem);
}

export function getItemLineTotal(item: OrderLineItem): number {
  if (typeof item.line_total === 'number' && item.line_total > 0) return item.line_total;
  const unit = item.unit_price ?? (item as { price?: number }).price ?? 0;
  const qty = item.quantity ?? 1;
  return unit * qty;
}

export function getItemImageUrl(item: OrderLineItem): string | null {
  const url = item.image_url?.trim();
  return url ? url : null;
}

/** Fill missing thumbnails from the products catalog (legacy orders). */
export async function enrichOrderItemsWithImages(
  items: OrderLineItem[],
  supabase: SupabaseClient,
): Promise<OrderLineItem[]> {
  const [enriched] = await enrichManyOrderItemLists([items], supabase);
  return enriched;
}

/** Batch thumbnail lookup for multiple orders (one products query). */
export async function enrichManyOrderItemLists(
  itemLists: OrderLineItem[][],
  supabase: SupabaseClient,
): Promise<OrderLineItem[][]> {
  const productIds = new Set<string>();
  for (const items of itemLists) {
    for (const item of items) {
      if (item.product_id && !getItemImageUrl(item)) {
        productIds.add(item.product_id);
      }
    }
  }

  if (!productIds.size) return itemLists;

  const { data: products } = await supabase
    .from('products')
    .select('id, thumbnail_url')
    .in('id', [...productIds]);

  const thumbById = new Map(
    (products ?? []).map((row) => [row.id as string, (row.thumbnail_url as string | null) ?? null]),
  );

  return itemLists.map((items) =>
    items.map((item) => {
      if (getItemImageUrl(item) || !item.product_id) return item;
      const thumb = thumbById.get(item.product_id);
      return thumb ? { ...item, image_url: thumb } : item;
    }),
  );
}

export function isReviewEligibleStatus(status: string) {
  return ['delivered', 'completed'].includes(status);
}

export function isReorderEligibleStatus(status: string) {
  return !['cancelled', 'refunded', 'pending_payment'].includes(status);
}