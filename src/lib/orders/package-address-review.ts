/**
 * Packed-package + address-label confirmation — stored on orders.compliance_flags.
 * No new columns. Same round / approve / note pattern as product-video-review.
 *
 * Client-safe helpers only. Sealed email tokens live in package-address-review-token.ts.
 */

export const PACKAGE_ADDRESS_REVIEW_STATUSES = ['pending', 'approved', 'changes_requested'] as const;
export type PackageAddressReviewStatus = (typeof PACKAGE_ADDRESS_REVIEW_STATUSES)[number];

export type PackageAddressReviewRound = {
  round: number;
  image_urls: string[];
  status: PackageAddressReviewStatus;
  notified_at: string;
  responded_at?: string;
  remarks?: string;
};

export type PackageAddressReview = PackageAddressReviewRound & {
  history: PackageAddressReviewRound[];
};

export const PACKAGE_ADDRESS_REVIEW_STATUS_LABELS: Record<PackageAddressReviewStatus, string> = {
  pending: 'Awaiting customer',
  approved: 'Confirmed',
  changes_requested: 'Address issue noted',
};

function asFlagsRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((url): url is string => typeof url === 'string')
    .map((url) => url.trim())
    .filter((url) => /^https?:\/\//i.test(url))
    .slice(0, 8);
}

function parseRound(raw: unknown): PackageAddressReviewRound | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<PackageAddressReviewRound>;
  const status = row.status;
  if (!status || !PACKAGE_ADDRESS_REVIEW_STATUSES.includes(status as PackageAddressReviewStatus)) {
    return null;
  }
  const image_urls = normalizeImageUrls(row.image_urls);
  if (!image_urls.length) return null;
  if (!row.notified_at || typeof row.notified_at !== 'string') return null;
  const round = Number(row.round);
  if (!Number.isInteger(round) || round < 1) return null;
  return {
    round,
    image_urls,
    status: status as PackageAddressReviewStatus,
    notified_at: row.notified_at,
    responded_at: row.responded_at ? String(row.responded_at) : undefined,
    remarks: row.remarks ? String(row.remarks).trim() : undefined,
  };
}

export function parsePackageAddressReview(complianceFlags: unknown): PackageAddressReview | null {
  const raw = asFlagsRecord(complianceFlags).package_address_review;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<PackageAddressReview> & { history?: unknown };
  const current = parseRound(row);
  if (!current) return null;
  const history = Array.isArray(row.history)
    ? row.history.map(parseRound).filter((r): r is PackageAddressReviewRound => Boolean(r))
    : [];
  return { ...current, history };
}

export function mergePackageAddressReview(
  complianceFlags: unknown,
  review: PackageAddressReview,
): Record<string, unknown> {
  return { ...asFlagsRecord(complianceFlags), package_address_review: review };
}

/** Start or refresh a pending review round when admin notifies the customer. */
export function beginPackageAddressReviewNotify(
  complianceFlags: unknown,
  imageUrls: string[],
): { flags: Record<string, unknown>; review: PackageAddressReview } {
  const urls = normalizeImageUrls(imageUrls);
  if (!urls.length) throw new Error('Upload at least one packing / address photo before notifying');

  const current = parsePackageAddressReview(complianceFlags);
  const now = new Date().toISOString();

  if (current?.status === 'pending') {
    const review: PackageAddressReview = {
      ...current,
      image_urls: urls,
      notified_at: now,
    };
    return { flags: mergePackageAddressReview(complianceFlags, review), review };
  }

  const history = [...(current?.history ?? [])];
  if (current) {
    const { history: _h, ...past } = current;
    history.push(past);
  }

  const review: PackageAddressReview = {
    round: (current?.round ?? 0) + 1,
    image_urls: urls,
    status: 'pending',
    notified_at: now,
    history,
  };
  return { flags: mergePackageAddressReview(complianceFlags, review), review };
}

/** Record customer confirm / address-issue note for the current pending round. */
export function recordPackageAddressReviewResponse(
  complianceFlags: unknown,
  input: { decision: 'approved' | 'changes_requested'; remarks?: string },
): { flags: Record<string, unknown>; review: PackageAddressReview } {
  const current = parsePackageAddressReview(complianceFlags);
  if (!current || current.status !== 'pending') {
    throw new Error('No pending package address review');
  }
  if (input.decision === 'changes_requested' && !input.remarks?.trim()) {
    throw new Error('Please add a short note about the address issue');
  }

  const review: PackageAddressReview = {
    ...current,
    status: input.decision,
    responded_at: new Date().toISOString(),
    remarks: input.decision === 'changes_requested' ? input.remarks!.trim() : undefined,
  };
  return { flags: mergePackageAddressReview(complianceFlags, review), review };
}

if (process.env.NODE_ENV !== 'production') {
  const flags = beginPackageAddressReviewNotify({}, ['https://example.com/pkg1.jpg']);
  console.assert(flags.review.round === 1 && flags.review.status === 'pending');
  const approved = recordPackageAddressReviewResponse(flags.flags, { decision: 'approved' });
  console.assert(approved.review.status === 'approved');
  const round2 = beginPackageAddressReviewNotify(approved.flags, [
    'https://example.com/pkg2.jpg',
    'https://example.com/addr2.jpg',
  ]);
  console.assert(round2.review.round === 2 && round2.review.history.length === 1);
  const changes = recordPackageAddressReviewResponse(round2.flags, {
    decision: 'changes_requested',
    remarks: 'Flat number is wrong',
  });
  console.assert(
    changes.review.status === 'changes_requested' && changes.review.remarks === 'Flat number is wrong',
  );
}
