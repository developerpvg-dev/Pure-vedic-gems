import { resolveProductDisplayPrice } from '@/lib/shop/product-pricing';
import type { ProductCard } from '@/lib/types/product';

type PricedProduct = Pick<ProductCard, 'id' | 'price' | 'price_per_carat' | 'carat_weight' | 'price_mode'>;

/** Sum primary + combo bead prices for a Rudraksha pendant configuration. */
export function resolveRudrakshaSelectionPrice(
  primary: PricedProduct | null,
  combo: PricedProduct[] = []
): number {
  if (!primary) return 0;

  const seen = new Set<string>();
  let total = 0;

  const add = (product: PricedProduct | null | undefined) => {
    if (!product?.id || seen.has(product.id)) return;
    seen.add(product.id);
    total += resolveProductDisplayPrice(product) ?? 0;
  };

  add(primary);
  for (const item of combo) {
    add(item);
  }

  return total;
}
