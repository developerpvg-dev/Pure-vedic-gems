/** Buckets admin can add a fixed ₹ charge into when editing / creating an offline order. */
export const ADDITIONAL_CHARGE_BUCKETS = [
  { id: 'stones', label: 'Gemstone / product', field: 'item_price' },
  { id: 'metal', label: 'Metal', field: 'metal_price' },
  { id: 'jewellery', label: 'Jewellery / making', field: 'labour_charge' },
  { id: 'certification', label: 'Certification', field: 'certification_fee' },
  { id: 'energization', label: 'Energization / puja', field: 'energization_fee' },
  { id: 'shipping', label: 'Shipping', field: 'shipping_fee' },
] as const;

export type AdditionalChargeBucketId = (typeof ADDITIONAL_CHARGE_BUCKETS)[number]['id'];

export type ManualDesignCharges = {
  description: string;
  item_price: number;
  metal_price: number;
  labour_charge: number;
  other_charge: number;
  certification_fee: number;
  energization_fee: number;
  shipping_fee: number;
};

export function isAdditionalChargeBucketId(value: string): value is AdditionalChargeBucketId {
  return ADDITIONAL_CHARGE_BUCKETS.some((b) => b.id === value);
}

export function additionalChargeBucketLabel(id: AdditionalChargeBucketId): string {
  return ADDITIONAL_CHARGE_BUCKETS.find((b) => b.id === id)?.label ?? id;
}

/** Empty manual_design shell; put the amount on the chosen bucket field. */
export function manualDesignForAdditionalCharge(
  bucket: AdditionalChargeBucketId,
  amount: number,
  description: string,
): ManualDesignCharges {
  const base: ManualDesignCharges = {
    description,
    item_price: 0,
    metal_price: 0,
    labour_charge: 0,
    other_charge: 0,
    certification_fee: 0,
    energization_fee: 0,
    shipping_fee: 0,
  };
  const field = ADDITIONAL_CHARGE_BUCKETS.find((b) => b.id === bucket)!.field;
  base[field] = amount;
  return base;
}

/** Infer bucket from a saved manual_design (edit reload). */
export function inferAdditionalChargeBucket(
  manual: Partial<ManualDesignCharges> | null | undefined,
): AdditionalChargeBucketId {
  if (!manual) return 'stones';
  if (Number(manual.shipping_fee) > 0) return 'shipping';
  if (Number(manual.energization_fee) > 0) return 'energization';
  if (Number(manual.certification_fee) > 0) return 'certification';
  if (Number(manual.labour_charge) > 0) return 'jewellery';
  if (Number(manual.metal_price) > 0) return 'metal';
  return 'stones';
}
