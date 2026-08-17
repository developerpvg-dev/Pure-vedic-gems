'use client';

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | IArguments>;
    gtag?: (command: 'event' | 'config' | 'js', target: string | Date, params?: AnalyticsParams) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/** Map our event names → Meta standard events used for ads optimization. */
const META_EVENT_MAP: Record<string, string> = {
  product_view: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  generate_lead: 'Lead',
  consultation_booking_submitted: 'Lead',
  consultation_payment_success: 'Purchase',
  yagya_payment_success: 'Purchase',
};

function trackMetaEvent(eventName: string, params: AnalyticsParams) {
  const metaEvent = META_EVENT_MAP[eventName];
  if (!metaEvent || typeof window === 'undefined' || !window.fbq) return;

  const payload: Record<string, string | number> = {};
  if (typeof params.value === 'number') payload.value = params.value;
  if (typeof params.currency === 'string') payload.currency = params.currency;
  if (typeof params.content_ids === 'string') payload.content_ids = params.content_ids;
  if (typeof params.content_name === 'string') payload.content_name = params.content_name;
  if (typeof params.content_type === 'string') payload.content_type = params.content_type;
  if (typeof params.num_items === 'number') payload.num_items = params.num_items;
  if (typeof params.product_id === 'string') {
    payload.content_ids = params.product_id;
    payload.content_type = 'product';
  }
  if (typeof params.product_name === 'string') payload.content_name = params.product_name;
  if (typeof params.transaction_id === 'string') payload.order_id = params.transaction_id;

  window.fbq('track', metaEvent, payload);
}

export function trackAnalyticsEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
  window.gtag?.('event', eventName, params);
  trackMetaEvent(eventName, params);
}

export function trackLeadEvent(source: string, params: AnalyticsParams = {}) {
  trackAnalyticsEvent('generate_lead', { source, ...params });
}

export function trackEcommerceEvent(
  eventName: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase',
  params: AnalyticsParams = {},
) {
  trackAnalyticsEvent(eventName, params);
}
