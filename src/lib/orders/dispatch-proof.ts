/**
 * Parcel Dispatch payment gate + proof of delivery.
 * Stored on orders.compliance_flags — no new columns.
 *
 * Client-safe helpers only. Sealed email tokens live in dispatch-proof-token.ts.
 */

export type DispatchPaymentVerified = {
  verified_at: string;
  verified_by?: string;
  note?: string;
};

export type ProofOfDelivery = {
  /** Private storage path (`delivery/…`) or legacy public https URL */
  image_urls: string[];
  details?: string;
  recorded_at: string;
  recorded_by?: string;
  sent_at?: string;
  sent_by?: string;
};

const PRE_VERIFY_STATUSES = new Set([
  'pending_payment',
  'placed',
  'confirmed',
  'payment_review',
]);

const ALWAYS_ALLOWED_STATUSES = new Set(['cancelled', 'refunded', 'payment_review']);

export const DELIVERY_PROOF_BUCKET = 'custom-uploads';

function asFlagsRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

/** Accept private paths or legacy public URLs. */
export function normalizeDeliveryImageRefs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((ref): ref is string => typeof ref === 'string')
    .map((ref) => ref.trim())
    .filter((ref) => /^https?:\/\//i.test(ref) || /^delivery\//.test(ref))
    .slice(0, 8);
}

/** Admin preview — auth-gated by order id (admin already knows the order). */
export function deliveryProofProxyUrl(orderId: string, index: number) {
  return `/api/orders/${orderId}/delivery-proof/${index}`;
}

export function resolveDeliveryStorageRef(
  ref: string,
): { bucket: string; path: string } | { publicUrl: string } | null {
  const trimmed = ref.trim();
  if (/^delivery\//.test(trimmed)) {
    return { bucket: DELIVERY_PROOF_BUCKET, path: trimmed };
  }
  const productsMatch = trimmed.match(
    /\/storage\/v1\/object\/public\/products\/(delivery\/[^?]+)/i,
  );
  if (productsMatch?.[1]) {
    return { bucket: 'products', path: decodeURIComponent(productsMatch[1]) };
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return { publicUrl: trimmed };
  }
  return null;
}

export function parseDispatchPaymentVerified(complianceFlags: unknown): DispatchPaymentVerified | null {
  const raw = asFlagsRecord(complianceFlags).dispatch_payment_verified;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<DispatchPaymentVerified>;
  if (!row.verified_at) return null;
  return {
    verified_at: String(row.verified_at),
    verified_by: row.verified_by ? String(row.verified_by) : undefined,
    note: row.note ? String(row.note) : undefined,
  };
}

export function isDispatchPaymentVerified(complianceFlags: unknown): boolean {
  return Boolean(parseDispatchPaymentVerified(complianceFlags)?.verified_at);
}

export function mergeDispatchPaymentVerified(
  complianceFlags: unknown,
  verified: DispatchPaymentVerified,
): Record<string, unknown> {
  return { ...asFlagsRecord(complianceFlags), dispatch_payment_verified: verified };
}

export function parseProofOfDelivery(complianceFlags: unknown): ProofOfDelivery | null {
  const raw = asFlagsRecord(complianceFlags).proof_of_delivery;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<ProofOfDelivery>;
  const image_urls = normalizeDeliveryImageRefs(row.image_urls);
  if (!row.recorded_at || image_urls.length === 0) return null;
  return {
    image_urls,
    details: row.details ? String(row.details) : undefined,
    recorded_at: String(row.recorded_at),
    recorded_by: row.recorded_by ? String(row.recorded_by) : undefined,
    sent_at: row.sent_at ? String(row.sent_at) : undefined,
    sent_by: row.sent_by ? String(row.sent_by) : undefined,
  };
}

export function mergeProofOfDelivery(
  complianceFlags: unknown,
  proof: ProofOfDelivery,
): Record<string, unknown> {
  return { ...asFlagsRecord(complianceFlags), proof_of_delivery: proof };
}

export function requiresDispatchPaymentVerify(
  complianceFlags: unknown,
  nextStatus: string | undefined,
  currentStatus: string,
): boolean {
  if (!nextStatus || nextStatus === currentStatus) return false;
  if (ALWAYS_ALLOWED_STATUSES.has(nextStatus)) return false;
  if (PRE_VERIFY_STATUSES.has(nextStatus)) return false;
  if (isDispatchPaymentVerified(complianceFlags)) return false;
  if (!PRE_VERIFY_STATUSES.has(currentStatus) && !ALWAYS_ALLOWED_STATUSES.has(currentStatus)) {
    return false;
  }
  return true;
}

if (process.env.NODE_ENV !== 'production') {
  const flags = {};
  const verified = mergeDispatchPaymentVerified(flags, {
    verified_at: '2026-01-01T00:00:00.000Z',
  });
  console.assert(requiresDispatchPaymentVerify(flags, 'processing', 'placed') === true);
  console.assert(requiresDispatchPaymentVerify(verified, 'processing', 'placed') === false);
  console.assert(requiresDispatchPaymentVerify(flags, 'cancelled', 'placed') === false);
  console.assert(requiresDispatchPaymentVerify(flags, 'shipped', 'processing') === false);
}
