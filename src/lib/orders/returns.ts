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
  authorized: 'Return authorized',
  received: 'Return received',
  inspection: 'Under inspection',
  approved: 'Return approved',
  rejected: 'Return rejected',
  closed: 'Return closed',
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
};

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

export function getDeliveredAt(input: {
  status: string;
  updated_at?: string | null;
  compliance_flags?: unknown;
}): string | null {
  const flags = parseComplianceFlags(input.compliance_flags);
  if (flags.delivered_at) return flags.delivered_at;
  // ponytail: no delivered_at column — stamp via compliance_flags on admin mark-delivered; fall back to updated_at
  if (input.status === 'delivered' && input.updated_at) return input.updated_at;
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
  if (input.orderStatus !== 'delivered') {
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
  console.log('returns self-check ok');
}
