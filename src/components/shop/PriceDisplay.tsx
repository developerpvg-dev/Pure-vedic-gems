import { formatPrice, formatEMI } from '@/lib/utils/format';

interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  pricePerCarat?: number | null;
  caratWeight?: number | null;
  showEMI?: boolean;
}

export function PriceDisplay({
  price,
  comparePrice,
  pricePerCarat,
  caratWeight,
  showEMI = true,
}: PriceDisplayProps) {
  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : null;

  return (
    <div className="space-y-1.5">
      {/* Main price row */}
      <div className="flex flex-wrap items-end gap-3">
        <span
          className="font-heading text-3xl font-bold leading-none tracking-tight md:text-4xl"
          style={{ color: 'var(--pvg-primary)' }}
        >
          {formatPrice(price)}
        </span>

        {comparePrice && comparePrice > price && (
          <span className="text-lg text-[var(--pvg-muted)] line-through">
            {formatPrice(comparePrice)}
          </span>
        )}

        {discount && (
          <span className="rounded-full bg-green-50 px-3 py-0.5 text-[12px] font-bold text-green-700">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Per carat price */}
      {pricePerCarat && caratWeight && (
        <p className="text-[13px] text-[var(--pvg-muted)]">
          {formatPrice(pricePerCarat)}/ct &nbsp;·&nbsp; {caratWeight.toFixed(2)} ct
        </p>
      )}

      {/* EMI */}
      {showEMI && price >= 10000 && (
        <p className="text-[12px] text-[var(--pvg-muted)]">
          EMI from{' '}
          <span className="font-semibold text-[var(--pvg-primary)]">
            {formatEMI(price, 12)}/mo
          </span>{' '}
          (12 months)
        </p>
      )}
    </div>
  );
}
