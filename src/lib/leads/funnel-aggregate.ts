/**
 * Aggregation helpers for lead funnels — kept pure so self-check can run without DB.
 */
import type { LeadFunnel } from '@/lib/leads/funnel';
import { LEAD_FUNNELS } from '@/lib/leads/funnel';

export type FunnelStageCounts = {
  page_views: number;
  form_starts: number;
  drafts: number;
  submitted: number;
  pay_started: number;
  pay_abandoned: number;
  pay_success: number;
  free_international: number;
  paid_pending: number;
};

export function emptyFunnelStage(): FunnelStageCounts {
  return {
    page_views: 0,
    form_starts: 0,
    drafts: 0,
    submitted: 0,
    pay_started: 0,
    pay_abandoned: 0,
    pay_success: 0,
    free_international: 0,
    paid_pending: 0,
  };
}

export function accumulateFunnelEvent(
  buckets: Record<LeadFunnel, FunnelStageCounts>,
  row: { funnel: string; event: string; meta?: Record<string, unknown> | null }
) {
  const funnel = row.funnel as LeadFunnel;
  if (!LEAD_FUNNELS.includes(funnel)) return;
  const bucket = buckets[funnel];
  if (row.event === 'page_view') bucket.page_views += 1;
  else if (row.event === 'form_start') bucket.form_starts += 1;
  else if (row.event === 'pay_started') bucket.pay_started += 1;
  else if (row.event === 'pay_abandoned') bucket.pay_abandoned += 1;
  else if (row.event === 'pay_success') {
    bucket.pay_success += 1;
    if (row.meta?.free_international === true) bucket.free_international += 1;
  }
}

export function assertFunnelAggregation() {
  const buckets = {
    remedies: emptyFunnelStage(),
    contact: emptyFunnelStage(),
    consultation: emptyFunnelStage(),
    blog: emptyFunnelStage(),
  };
  accumulateFunnelEvent(buckets, { funnel: 'remedies', event: 'page_view' });
  accumulateFunnelEvent(buckets, { funnel: 'remedies', event: 'form_start' });
  accumulateFunnelEvent(buckets, {
    funnel: 'remedies',
    event: 'pay_success',
    meta: { free_international: true },
  });
  accumulateFunnelEvent(buckets, { funnel: 'shop', event: 'page_view' });
  if (buckets.remedies.page_views !== 1) throw new Error('page_views');
  if (buckets.remedies.form_starts !== 1) throw new Error('form_starts');
  if (buckets.remedies.pay_success !== 1 || buckets.remedies.free_international !== 1) {
    throw new Error('pay_success intl');
  }
  if (buckets.contact.page_views !== 0) throw new Error('unknown funnel ignored');
}

/** Draft upsert identity: one draft per session + source (+ blog slug). */
export function draftUpsertKey(sessionId: string, source: string, blogSlug?: string | null) {
  return `${sessionId}::${source}::${blogSlug ?? ''}`;
}

export function assertDraftUpsertKey() {
  const a = draftUpsertKey('s1', 'blog_popup', 'neelam');
  const b = draftUpsertKey('s1', 'blog_popup', 'neelam');
  const c = draftUpsertKey('s1', 'blog_popup', 'ruby');
  if (a !== b) throw new Error('same draft key');
  if (a === c) throw new Error('blog slug must differentiate');
}
