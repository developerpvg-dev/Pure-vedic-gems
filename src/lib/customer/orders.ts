import type { Json } from '@/lib/types/database';

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
}

export function parseOrderItems(value: Json): OrderLineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    .map((item) => item as unknown as OrderLineItem);
}

export function isReviewEligibleStatus(status: string) {
  return ['delivered', 'completed'].includes(status);
}

export function isReorderEligibleStatus(status: string) {
  return !['cancelled', 'refunded', 'pending_payment'].includes(status);
}