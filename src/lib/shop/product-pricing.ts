/**
 * Single source of truth for storefront product pricing & purchasability.
 *
 * Legacy WooCommerce navaratna gems store per-carat rates; total price may be
 * derived from price_per_carat × carat_weight. Only explicit quote modes
 * (on_demand / quote_required) with no resolvable price are enquiry-only.
 */

import { formatPrice } from '@/lib/utils/format';

export type ProductPricingInput = {
  price: number;
  price_per_carat?: number | null;
  carat_weight?: number | null;
  price_mode?: string | null;
  compare_price?: number | null;
  in_stock?: boolean | null;
  stock_quantity?: number | null;
  availability_status?: string | null;
  sold_individually?: boolean | null;
};

export function resolveProductDisplayPrice(product: ProductPricingInput): number | null {
  if (product.price_mode === 'on_demand' || product.price_mode === 'quote_required') {
    return null;
  }
  if (product.price_mode === 'free') {
    return 0;
  }
  if (product.price > 0) {
    return product.price;
  }
  if (
    product.price_per_carat &&
    product.price_per_carat > 0 &&
    product.carat_weight &&
    product.carat_weight > 0
  ) {
    return Math.round(product.price_per_carat * product.carat_weight);
  }
  return null;
}

export function isProductPriceOnRequest(product: ProductPricingInput): boolean {
  return (
    product.price_mode === 'on_demand' ||
    product.price_mode === 'quote_required' ||
    resolveProductDisplayPrice(product) == null
  );
}

/** Price stored on cart line items — never quote-only without a resolved amount. */
export function resolveProductCartPrice(product: ProductPricingInput): number {
  return resolveProductDisplayPrice(product) ?? 0;
}

export function getProductUnavailableLabel(availabilityStatus?: string | null): string {
  if (availabilityStatus === 'reserved') return 'Reserved';
  if (availabilityStatus === 'sold') return 'Sold';
  return 'Out of Stock';
}

export function isProductStockUnavailable(product: ProductPricingInput): boolean {
  if (isProductPriceOnRequest(product)) return false;

  const stockQuantity =
    product.stock_quantity == null ? 99 : Math.max(0, Number(product.stock_quantity));
  const maxQuantity = product.sold_individually ? Math.min(1, stockQuantity) : stockQuantity;

  return (
    !product.in_stock ||
    maxQuantity <= 0 ||
    ['sold', 'reserved', 'out_of_stock', 'archived'].includes(product.availability_status ?? '')
  );
}

export function isProductPurchasable(product: ProductPricingInput): boolean {
  return !isProductPriceOnRequest(product) && !isProductStockUnavailable(product);
}

export function formatProductListPrice(product: ProductPricingInput): {
  label: string;
  detail?: string;
} {
  if (product.price_mode === 'free') {
    return { label: 'Free' };
  }
  if (isProductPriceOnRequest(product)) {
    return { label: 'Price on Request' };
  }

  const resolved = resolveProductDisplayPrice(product);
  if (resolved != null && resolved > 0) {
    return {
      label: formatPrice(resolved),
      detail:
        product.price_per_carat && product.price_per_carat > 0
          ? `${formatPrice(product.price_per_carat)}/ct`
          : undefined,
    };
  }

  if (product.price_per_carat && product.price_per_carat > 0) {
    return { label: `${formatPrice(product.price_per_carat)}/ct` };
  }

  return { label: 'Price on Request' };
}

/** Schema.org Offer availability for structured data. */
export function productOfferAvailability(product: ProductPricingInput): string {
  if (isProductPriceOnRequest(product)) {
    return 'https://schema.org/LimitedAvailability';
  }
  if (isProductStockUnavailable(product)) {
    return 'https://schema.org/OutOfStock';
  }
  return 'https://schema.org/InStock';
}

export function productStructuredOfferPrice(product: ProductPricingInput): number | undefined {
  const resolved = resolveProductDisplayPrice(product);
  if (resolved == null) return undefined;
  if (product.price_mode === 'free') return 0;
  return resolved > 0 ? resolved : undefined;
}
