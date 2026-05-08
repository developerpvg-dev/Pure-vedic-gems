'use client';

import { trackAnalyticsEvent } from '@/lib/utils/analytics';

export type StorefrontEventName =
  | 'homepage_category_click'
  | 'product_view'
  | 'add_to_cart'
  | 'search_open'
  | 'search_submit'
  | 'configurator_start'
  | 'wishlist_toggle'
  | 'blog_share'
  | 'consultation_booking_submitted'
  | 'consultation_payment_success'
  | 'knowledge_category_view';

type StorefrontPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | IArguments>;
  }
}

export function trackStorefrontEvent(eventName: StorefrontEventName, payload: StorefrontPayload = {}) {
  if (typeof window === 'undefined') return;

  const event = {
    event: eventName,
    ...payload,
  };

  trackAnalyticsEvent(eventName, payload);
  window.dispatchEvent(new CustomEvent('pvg:storefront-event', { detail: event }));

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[storefront event]', eventName, payload);
  }
}