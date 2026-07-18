/** Plan zone code for all non-India destinations (CHAR(2) in shipping_countries). */
export const INTL_SHIPPING_ZONE = 'XX';

export function resolveShippingPlanCountry(addressCountryCode: string): string {
  return addressCountryCode === 'IN' ? 'IN' : INTL_SHIPPING_ZONE;
}

export function planAppliesToCountry(
  planCountryCode: string | null | undefined,
  addressCountryCode: string
): boolean {
  if (!planCountryCode) return false;
  if (addressCountryCode === 'IN') return planCountryCode === 'IN';
  return planCountryCode === INTL_SHIPPING_ZONE || planCountryCode === addressCountryCode;
}

export function planAppliesToSubtotal(
  plan: { min_order_amount?: number | null; max_order_amount?: number | null },
  subtotal: number
): boolean {
  const min = plan.min_order_amount;
  const max = plan.max_order_amount;
  // Match pricing.ts: 0 / null means no bound.
  if (min && subtotal < Number(min)) return false;
  if (max && subtotal > Number(max)) return false;
  return true;
}
