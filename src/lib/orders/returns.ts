/** Return / RMA helpers — uses existing orders.return_status + products.return_* columns. */

export const RETURN_STATUSES = [
  'none',
  'requested',
  'authorized',
  'received',
  'inspection',
  'approved',
  'rejected',
  'closed',
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  none: 'No return',
  requested: 'Return requested',
  authorized: 'Return verified',
  received: 'Return initiated (pickup)',
  inspection: 'Under inspection',
  approved: 'Refund initiated',
  rejected: 'Return rejected',
  closed: 'Refund completed',
};

const NON_RETURNABLE = new Set([
  'custom_jewellery',
  'service',
  'non_returnable',
]);

export const DEFAULT_RETURN_WINDOW_DAYS = 15;

export type ReturnComplianceFlags = {
  delivered_at?: string;
  return_reason?: string;
  return_requested_at?: string;
  return_admin_note?: string;
  /** Customer answered post-delivery “received properly?” */
  receipt_confirmed?: boolean;
  receipt_ok?: boolean;
  receipt_confirmed_at?: string;
  /** Customer evidence photos for return/refund */
  return_image_urls?: string[];
  /** Admin verified customer photos before refund can proceed */
  return_images_verified?: boolean;
  return_images_verified_at?: string;
  /** Energization / puja picture plan — shown on customer tracking */
  energization_image_urls?: string[];
  /** Design media — multiple product videos / images, shown on tracking + review email */
  product_video_urls?: string[];
  product_image_urls?: string[];
  /** Packed package + address-label photos for customer confirm before ship */
  packing_image_urls?: string[];
};

/** Trim https URL lists stored on compliance_flags (media, energization, returns). */
export function normalizeHttpsUrlList(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((url): url is string => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\//i.test(url))
    .slice(0, max);
}

export function parseComplianceFlags(value: unknown): ReturnComplianceFlags {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ReturnComplianceFlags;
}

export function mergeComplianceFlags(
  current: unknown,
  patch: ReturnComplianceFlags,
): ReturnComplianceFlags {
  return { ...parseComplianceFlags(current), ...patch };
}

export function normalizeReturnImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((url): url is string => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\//i.test(url))
    .slice(0, 6);
}

/** Refund approval / record requires verified customer photos when a return was requested. */
export function requiresVerifiedReturnImages(flags: ReturnComplianceFlags, returnStatus: string): boolean {
  const hasReturn = returnStatus !== 'none' && returnStatus !== 'rejected' && returnStatus !== 'closed';
  const hasImages = (flags.return_image_urls?.length ?? 0) > 0;
  return hasReturn || hasImages;
}

export function areReturnImagesVerified(flags: ReturnComplianceFlags): boolean {
  return Boolean(flags.return_images_verified) && (flags.return_image_urls?.length ?? 0) > 0;
}

export function getDeliveredAt(input: {
  status: string;
  updated_at?: string | null;
  compliance_flags?: unknown;
}): string | null {
  const flags = parseComplianceFlags(input.compliance_flags);
  if (flags.delivered_at) return flags.delivered_at;
  // ponytail: no delivered_at column — stamp via compliance_flags on admin mark-delivered; fall back to updated_at
  if ((input.status === 'delivered' || input.status === 'feedback') && input.updated_at) {
    return input.updated_at;
  }
  return null;
}

export function daysBetween(fromIso: string, to = new Date()): number {
  const from = new Date(fromIso).getTime();
  if (Number.isNaN(from)) return Number.POSITIVE_INFINITY;
  return Math.floor((to.getTime() - from) / (24 * 60 * 60 * 1000));
}

export function resolveReturnWindowDays(
  products: Array<{ return_eligibility?: string | null; return_window_days?: number | null }>,
): { windowDays: number; allNonReturnable: boolean } {
  const returnable = products.filter(
    (p) => !NON_RETURNABLE.has(p.return_eligibility ?? 'standard'),
  );
  if (!products.length) {
    return { windowDays: DEFAULT_RETURN_WINDOW_DAYS, allNonReturnable: false };
  }
  if (!returnable.length) {
    return { windowDays: 0, allNonReturnable: true };
  }
  const windowDays = Math.max(
    ...returnable.map((p) =>
      typeof p.return_window_days === 'number' && p.return_window_days > 0
        ? p.return_window_days
        : DEFAULT_RETURN_WINDOW_DAYS,
    ),
  );
  return { windowDays, allNonReturnable: false };
}

export function evaluateReturnEligibility(input: {
  orderStatus: string;
  returnStatus: string;
  deliveredAt: string | null;
  windowDays: number;
  allNonReturnable: boolean;
}): { eligible: boolean; reason: string; daysLeft: number | null } {
  if (input.returnStatus !== 'none') {
    return {
      eligible: false,
      reason: RETURN_STATUS_LABELS[input.returnStatus as ReturnStatus] ?? 'Return already in progress',
      daysLeft: null,
    };
  }
  if (input.orderStatus !== 'delivered' && input.orderStatus !== 'feedback') {
    return {
      eligible: false,
      reason: 'Returns open only after the order is delivered',
      daysLeft: null,
    };
  }
  if (input.allNonReturnable) {
    return {
      eligible: false,
      reason: 'Items in this order are not eligible for return',
      daysLeft: null,
    };
  }
  if (!input.deliveredAt) {
    return {
      eligible: false,
      reason: 'Delivery date is not recorded yet — contact support to return',
      daysLeft: null,
    };
  }
  const elapsed = daysBetween(input.deliveredAt);
  const daysLeft = input.windowDays - elapsed;
  if (daysLeft < 0) {
    return {
      eligible: false,
      reason: `Return window of ${input.windowDays} days has ended`,
      daysLeft: 0,
    };
  }
  return {
    eligible: true,
    reason: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to request a return`,
    daysLeft,
  };
}

export function isValidReturnStatus(value: string): value is ReturnStatus {
  return (RETURN_STATUSES as readonly string[]).includes(value);
}

// ponytail: runnable self-check — `npx tsx -e "import { __returnsSelfCheck } from './src/lib/orders/returns.ts'; __returnsSelfCheck()"`
export function __returnsSelfCheck() {
  const now = new Date();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();

  const ok = evaluateReturnEligibility({
    orderStatus: 'delivered',
    returnStatus: 'none',
    deliveredAt: tenDaysAgo,
    windowDays: 15,
    allNonReturnable: false,
  });
  console.assert(ok.eligible === true && (ok.daysLeft ?? 0) >= 4, 'within window');

  const afterFeedback = evaluateReturnEligibility({
    orderStatus: 'feedback',
    returnStatus: 'none',
    deliveredAt: tenDaysAgo,
    windowDays: 15,
    allNonReturnable: false,
  });
  console.assert(afterFeedback.eligible === true, 'feedback stage still returnable');

  const late = evaluateReturnEligibility({
    orderStatus: 'delivered',
    returnStatus: 'none',
    deliveredAt: twentyDaysAgo,
    windowDays: 15,
    allNonReturnable: false,
  });
  console.assert(late.eligible === false, 'past window');

  const blocked = evaluateReturnEligibility({
    orderStatus: 'delivered',
    returnStatus: 'none',
    deliveredAt: tenDaysAgo,
    windowDays: 15,
    allNonReturnable: true,
  });
  console.assert(blocked.eligible === false, 'non-returnable');

  console.assert(isValidReturnStatus('requested'), 'valid status');
  console.assert(!isValidReturnStatus('foo'), 'invalid status');

  const withImages = {
    return_image_urls: ['https://cdn.example/a.jpg'],
  };
  console.assert(requiresVerifiedReturnImages(withImages, 'requested'), 'gate when return open');
  console.assert(!areReturnImagesVerified(withImages), 'unverified until admin marks');
  console.assert(
    areReturnImagesVerified({ ...withImages, return_images_verified: true }),
    'verified when flagged',
  );
  console.assert(!requiresVerifiedReturnImages({}, 'none'), 'no gate without return');
  console.assert(normalizeReturnImageUrls(['https://x.com/a.jpg', 'bad']).length === 1, 'normalize urls');
  console.log('returns self-check ok');
}
