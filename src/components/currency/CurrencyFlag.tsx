'use client';

import { flagSrcForCurrency } from '@/lib/currency/catalog';

export function CurrencyFlag({
  code,
  width = 22,
  height = 15,
}: {
  code: string;
  width?: number;
  height?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small flag icons; mix of local SVG + CDN PNG
    <img
      src={flagSrcForCurrency(code)}
      alt=""
      width={width}
      height={height}
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: 2,
        flexShrink: 0,
        display: 'block',
        objectFit: 'cover',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
      }}
    />
  );
}
