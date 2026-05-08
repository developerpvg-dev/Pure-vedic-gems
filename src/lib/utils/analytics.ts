'use client';

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | IArguments>;
    gtag?: (command: 'event' | 'config' | 'js', target: string | Date, params?: AnalyticsParams) => void;
  }
}

export function trackAnalyticsEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
  window.gtag?.('event', eventName, params);
}

export function trackLeadEvent(source: string, params: AnalyticsParams = {}) {
  trackAnalyticsEvent('generate_lead', { source, ...params });
}

export function trackEcommerceEvent(eventName: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase', params: AnalyticsParams = {}) {
  trackAnalyticsEvent(eventName, params);
}