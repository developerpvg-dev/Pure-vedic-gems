'use client';

import Script from 'next/script';
import { useCallback, useRef, useState } from 'react';
import { TURNSTILE_ENQUIRY_ACTION } from '@/lib/enquiry/verify-turnstile';

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '';

type TurnstileWidgetId = string;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: { sitekey: string; action: string; callback: (token: string) => void }
  ) => TurnstileWidgetId;
  reset: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const [token, setToken] = useState('');
  const enabled = Boolean(TURNSTILE_SITE_KEY);

  const renderWidget = useCallback(() => {
    if (!enabled || !containerRef.current || widgetIdRef.current !== null || !window.turnstile) {
      return;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action: TURNSTILE_ENQUIRY_ACTION,
      callback: setToken,
    });
  }, [enabled]);

  const reset = useCallback(() => {
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setToken('');
    }
  }, []);

  const script = enabled ? (
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
      onReady={renderWidget}
    />
  ) : null;

  const field = enabled ? <div ref={containerRef} className="min-h-[65px]" /> : null;

  return {
    enabled,
    token,
    ready: !enabled || Boolean(token),
    reset,
    script,
    field,
  };
}
