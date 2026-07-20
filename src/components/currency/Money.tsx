'use client';

import { useCurrency } from '@/lib/hooks/useCurrency';
import { formatPrice } from '@/lib/utils/format';

/** Client price that follows the storefront currency selector. */
export function Money({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  const { currency, rates } = useCurrency();
  // subscribe via currency/rates so label updates when FX or selection changes
  void currency;
  void rates;
  return <span className={className}>{formatPrice(amount)}</span>;
}
