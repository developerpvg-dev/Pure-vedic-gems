/** Where an admin manual discount is taken from. `null` keeps the old whole-order discount. */
export const MANUAL_DISCOUNT_TARGETS = [
  { id: 'stones', label: 'Gemstone' },
  { id: 'design', label: 'Design' },
  { id: 'certification', label: 'Certification' },
  { id: 'energization', label: 'Energization / puja' },
  { id: 'shipping', label: 'Shipping' },
] as const;

export type ManualDiscountTarget = (typeof MANUAL_DISCOUNT_TARGETS)[number]['id'];

const FLAG = 'manual_discount_target';

export function isManualDiscountTarget(value: string): value is ManualDiscountTarget {
  return MANUAL_DISCOUNT_TARGETS.some((row) => row.id === value);
}

export function manualDiscountTargetLabel(id: ManualDiscountTarget): string {
  return MANUAL_DISCOUNT_TARGETS.find((row) => row.id === id)?.label ?? id;
}

export function manualDiscountLineLabel(target: string | null | undefined): string {
  if (target && isManualDiscountTarget(target)) {
    return `Discount · ${manualDiscountTargetLabel(target)}`;
  }
  return 'Discount';
}

export function readManualDiscountTarget(flags: unknown): ManualDiscountTarget | null {
  if (!flags || typeof flags !== 'object' || Array.isArray(flags)) return null;
  const value = (flags as Record<string, unknown>)[FLAG];
  return typeof value === 'string' && isManualDiscountTarget(value) ? value : null;
}

/** Copy flags and set or clear the discount target. Does not touch other keys. */
export function withManualDiscountTarget(
  flags: unknown,
  target: ManualDiscountTarget | null,
): Record<string, unknown> {
  const base =
    flags && typeof flags === 'object' && !Array.isArray(flags)
      ? { ...(flags as Record<string, unknown>) }
      : {};
  if (target) base[FLAG] = target;
  else delete base[FLAG];
  return base;
}

export function capManualDiscount(args: {
  target: ManualDiscountTarget | null;
  requested: number;
  subtotal: number;
  jewelry: number;
  metal: number;
  certification: number;
  energization: number;
  shipping: number;
  /** Merchandise left after coupon and rewards. Shipping is outside this. */
  merchandiseAfterCouponReward: number;
}): {
  amount: number;
  onMerchandise: number;
  onShipping: number;
  /** Design discounts reduce the weight-jewellery GST base by this much. */
  gstBaseReduction: number;
} {
  const requested = Math.max(0, Number(args.requested) || 0);
  const room = Math.max(0, args.merchandiseAfterCouponReward);
  if (!args.target) {
    const amount = Math.min(requested, room);
    return { amount, onMerchandise: amount, onShipping: 0, gstBaseReduction: 0 };
  }
  const bucket =
    args.target === 'stones'
      ? args.subtotal
      : args.target === 'design'
        ? args.jewelry + args.metal
        : args.target === 'certification'
          ? args.certification
          : args.target === 'energization'
            ? args.energization
            : args.shipping;
  const amount =
    args.target === 'shipping'
      ? Math.min(requested, Math.max(0, bucket))
      : Math.min(requested, Math.max(0, bucket), room);
  return {
    amount,
    onMerchandise: args.target === 'shipping' ? 0 : amount,
    onShipping: args.target === 'shipping' ? amount : 0,
    gstBaseReduction: args.target === 'design' ? amount : 0,
  };
}
