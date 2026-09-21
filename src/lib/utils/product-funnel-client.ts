'use client';

import { getLeadFunnelSessionId } from '@/lib/utils/lead-funnel-client';
import type { ProductFunnelEvent, WhatsAppContext } from '@/lib/commerce/product-funnel';
import { getWhatsAppUrl } from '@/lib/resend/email-config';
import { whatsappPrefill } from '@/lib/commerce/product-funnel';

/** Events that are unique per session in DB — skip repeat network hits in this tab. */
const DEDUPE_EVENTS = new Set<ProductFunnelEvent>([
  'category_view',
  'product_view',
  'product_click',
  'add_to_cart',
  'begin_checkout',
  'checkout_abandon',
  'whatsapp_click',
  'call_click',
]);

const firedKeys = new Set<string>();

function dedupeKey(input: TrackProductFunnelInput, sessionId: string): string | null {
  if (!DEDUPE_EVENTS.has(input.event)) return null;
  return [
    sessionId,
    input.event,
    input.category ?? '',
    input.product_id ?? '',
    input.source ?? '',
  ].join('|');
}

export type TrackProductFunnelInput = {
  event: ProductFunnelEvent;
  page_path?: string;
  category?: string | null;
  product_id?: string | null;
  product_sku?: string | null;
  product_name?: string | null;
  source?: string | null;
  meta?: Record<string, string | number | boolean | null>;
  /** Abandoned checkout contact draft */
  checkout_draft?: {
    step?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    cart_snapshot?: unknown;
    shipping_snapshot?: unknown;
  };
  clear_checkout_draft?: boolean;
};

export function trackProductFunnel(input: TrackProductFunnelInput) {
  if (typeof window === 'undefined') return;
  const session_id = getLeadFunnelSessionId();
  if (!session_id) return;

  // Client short-circuit for session-unique events (refresh / remount)
  const key = !input.checkout_draft && !input.clear_checkout_draft ? dedupeKey(input, session_id) : null;
  if (key) {
    if (firedKeys.has(key)) return;
    firedKeys.add(key);
  }

  const body = JSON.stringify({
    session_id,
    event: input.event,
    page_path: input.page_path ?? window.location.pathname,
    category: input.category,
    product_id: input.product_id,
    product_sku: input.product_sku,
    product_name: input.product_name,
    source: input.source,
    meta: input.meta,
    checkout_draft: input.checkout_draft,
    clear_checkout_draft: input.clear_checkout_draft,
  });

  const url = '/api/commerce/funnel';
  try {
    if (navigator.sendBeacon && !input.checkout_draft) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    /* fall through */
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackedWhatsAppHref(
  context: WhatsAppContext,
  bits?: Parameters<typeof whatsappPrefill>[1]
): string {
  return getWhatsAppUrl(whatsappPrefill(context, bits));
}

export function trackWhatsAppClick(opts: {
  context: WhatsAppContext;
  source: string;
  category?: string | null;
  product_id?: string | null;
  product_sku?: string | null;
  product_name?: string | null;
}) {
  trackProductFunnel({
    event: 'whatsapp_click',
    category: opts.category,
    product_id: opts.product_id,
    product_sku: opts.product_sku,
    product_name: opts.product_name,
    source: opts.source,
    meta: { context: opts.context },
  });
}

export function trackCallClick(opts: {
  source: string;
  category?: string | null;
  product_id?: string | null;
  product_sku?: string | null;
  product_name?: string | null;
}) {
  trackProductFunnel({
    event: 'call_click',
    category: opts.category,
    product_id: opts.product_id,
    product_sku: opts.product_sku,
    product_name: opts.product_name,
    source: opts.source,
  });
}
