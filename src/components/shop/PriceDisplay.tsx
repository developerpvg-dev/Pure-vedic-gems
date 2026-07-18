import {
  formatProductListPrice,
  isProductPriceOnRequest,
  resolveProductDisplayPrice,
} from '@/lib/shop/product-pricing';
import { formatPrice } from '@/lib/utils/format';

interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  pricePerCarat?: number | null;
  caratWeight?: number | null;
  /** @deprecated EMI removed — unique pieces don't show EMI */
  showEMI?: boolean;
  priceMode?: string | null;
}

export function PriceDisplay({
  price,
  comparePrice,
  pricePerCarat,
  caratWeight,
  priceMode,
}: PriceDisplayProps) {
  const product = {
    price,
    compare_price: comparePrice,
    price_per_carat: pricePerCarat,
    carat_weight: caratWeight,
    price_mode: priceMode,
  };
  const isOnRequest = isProductPriceOnRequest(product);
  const resolvedPrice = resolveProductDisplayPrice(product) ?? 0;
  const priceDisplay = formatProductListPrice(product);

  if (isOnRequest) {
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-2xl font-medium leading-none tracking-tight text-[#7A1515] lg:text-3xl">
            Price on Request
          </span>
        </div>
        <p className="text-[13px] text-brand-muted">
          Contact us for a personalized quote on this premium gemstone.
        </p>
      </div>
    );
  }

  const discount =
    comparePrice && comparePrice > resolvedPrice
      ? Math.round(((comparePrice - resolvedPrice) / comparePrice) * 100)
      : null;

  return (
    <div className="product-price-display space-y-1 md:space-y-1 lg:space-y-1.5">
      <div className="flex flex-wrap items-end gap-2 md:gap-2 lg:gap-3">
        <span className="product-price-main text-[clamp(24px,7vw,36px)] font-medium leading-none tracking-tight text-[#111111] lg:text-4xl">
          {priceDisplay.label}
        </span>

        {comparePrice && comparePrice > resolvedPrice && (
          <span className="product-price-compare text-lg text-brand-muted line-through lg:text-lg">
            {formatPrice(comparePrice)}
          </span>
        )}

        {discount && (
          <span className="product-price-discount rounded px-2 py-0.5 text-[10px] font-bold text-white lg:px-3 lg:py-1 lg:text-[11px]" style={{ background: '#7A1515' }}>
            {discount}% off
          </span>
        )}
      </div>

      {priceDisplay.detail && (
        <p className="product-price-meta text-[12px] text-brand-muted lg:text-[13px]">
          {priceDisplay.detail}
          {caratWeight ? ` · ${caratWeight.toFixed(2)} ct` : ''}
        </p>
      )}
    </div>
  );
}
