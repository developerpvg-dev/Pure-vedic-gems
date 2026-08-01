/**
 * Product design video approval — stored on orders.compliance_flags.
 * No new columns. Supports multiple revision rounds.
 *
 * Client-safe helpers only. Sealed email tokens live in product-video-review-token.ts.
 */

export const PRODUCT_VIDEO_REVIEW_STATUSES = ['pending', 'approved', 'changes_requested'] as const;
export type ProductVideoReviewStatus = (typeof PRODUCT_VIDEO_REVIEW_STATUSES)[number];

export type ProductVideoReviewRound = {
  round: number;
  video_url: string;
  status: ProductVideoReviewStatus;
  notified_at: string;
  responded_at?: string;
  remarks?: string;
};

export type ProductVideoReview = ProductVideoReviewRound & {
  history: ProductVideoReviewRound[];
};

export const PRODUCT_VIDEO_REVIEW_STATUS_LABELS: Record<ProductVideoReviewStatus, string> = {
  pending: 'Awaiting customer',
  approved: 'Approved',
  changes_requested: 'Changes requested',
};

function asFlagsRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function parseRound(raw: unknown): ProductVideoReviewRound | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<ProductVideoReviewRound>;
  const status = row.status;
  if (!status || !PRODUCT_VIDEO_REVIEW_STATUSES.includes(status as ProductVideoReviewStatus)) return null;
  if (!row.video_url || typeof row.video_url !== 'string') return null;
  if (!row.notified_at || typeof row.notified_at !== 'string') return null;
  const round = Number(row.round);
  if (!Number.isInteger(round) || round < 1) return null;
  return {
    round,
    video_url: row.video_url.trim(),
    status: status as ProductVideoReviewStatus,
    notified_at: row.notified_at,
    responded_at: row.responded_at ? String(row.responded_at) : undefined,
    remarks: row.remarks ? String(row.remarks).trim() : undefined,
  };
}

export function parseProductVideoReview(complianceFlags: unknown): ProductVideoReview | null {
  const raw = asFlagsRecord(complianceFlags).product_video_review;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Partial<ProductVideoReview> & { history?: unknown };
  const current = parseRound(row);
  if (!current) return null;
  const history = Array.isArray(row.history)
    ? row.history.map(parseRound).filter((r): r is ProductVideoReviewRound => Boolean(r))
    : [];
  return { ...current, history };
}

export function mergeProductVideoReview(
  complianceFlags: unknown,
  review: ProductVideoReview,
): Record<string, unknown> {
  return { ...asFlagsRecord(complianceFlags), product_video_review: review };
}

/** Start or refresh a pending review round when admin notifies the customer. */
export function beginProductVideoReviewNotify(
  complianceFlags: unknown,
  videoUrl: string,
): { flags: Record<string, unknown>; review: ProductVideoReview } {
  const url = videoUrl.trim();
  if (!url) throw new Error('Product video URL is required');

  const current = parseProductVideoReview(complianceFlags);
  const now = new Date().toISOString();

  if (current?.status === 'pending') {
    const review: ProductVideoReview = {
      ...current,
      video_url: url,
      notified_at: now,
    };
    return { flags: mergeProductVideoReview(complianceFlags, review), review };
  }

  const history = [...(current?.history ?? [])];
  if (current) {
    const { history: _h, ...past } = current;
    history.push(past);
  }

  const review: ProductVideoReview = {
    round: (current?.round ?? 0) + 1,
    video_url: url,
    status: 'pending',
    notified_at: now,
    history,
  };
  return { flags: mergeProductVideoReview(complianceFlags, review), review };
}

/** Record customer approve / changes-requested for the current pending round. */
export function recordProductVideoReviewResponse(
  complianceFlags: unknown,
  input: { decision: 'approved' | 'changes_requested'; remarks?: string },
): { flags: Record<string, unknown>; review: ProductVideoReview } {
  const current = parseProductVideoReview(complianceFlags);
  if (!current || current.status !== 'pending') {
    throw new Error('No pending product video review');
  }
  if (input.decision === 'changes_requested' && !input.remarks?.trim()) {
    throw new Error('Please add a short note about what to change');
  }

  const review: ProductVideoReview = {
    ...current,
    status: input.decision,
    responded_at: new Date().toISOString(),
    remarks: input.decision === 'changes_requested' ? input.remarks!.trim() : undefined,
  };
  return { flags: mergeProductVideoReview(complianceFlags, review), review };
}

if (process.env.NODE_ENV !== 'production') {
  const flags = beginProductVideoReviewNotify({}, 'https://example.com/v1.mp4');
  console.assert(flags.review.round === 1 && flags.review.status === 'pending');
  const approved = recordProductVideoReviewResponse(flags.flags, { decision: 'approved' });
  console.assert(approved.review.status === 'approved');
  const round2 = beginProductVideoReviewNotify(approved.flags, 'https://example.com/v2.mp4');
  console.assert(round2.review.round === 2 && round2.review.history.length === 1);
  const changes = recordProductVideoReviewResponse(round2.flags, {
    decision: 'changes_requested',
    remarks: 'Stone looks tilted',
  });
  console.assert(changes.review.status === 'changes_requested' && changes.review.remarks === 'Stone looks tilted');
}
