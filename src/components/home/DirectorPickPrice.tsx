'use client';

import { Money } from '@/components/currency/Money';

/** Director-pick price row that follows the storefront currency selector. */
export function DirectorPickPrice({
  price,
  comparePrice,
  discount,
}: {
  price: number;
  comparePrice: number | null;
  discount: number | null;
}) {
  return (
    <div className="pick-price-line">
      <span className="pick-price">
        <Money amount={price} className="pick-price-value" />
      </span>
      {comparePrice ? (
        <span className="pick-compare-price">
          <Money amount={comparePrice} />
        </span>
      ) : null}
      {discount ? <span className="pick-discount">({discount}% off)</span> : null}
    </div>
  );
}
