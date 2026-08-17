'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TURNSTILE_ENQUIRY_ACTION } from '@/lib/enquiry/verify-turnstile';
import { isTurnstileProductionHost } from '@/lib/enquiry/turnstile-host';

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '';

type TurnstileWidgetId = string;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      appearance?: 'always' | 'execute' | 'interaction-only';
      callback: (token: string) => void;
      'error-callback'?: () => void;
    }
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
  const [loadError, setLoadError] = useState(false);
  const [hostOk, setHostOk] = useState(false);

  useEffect(() => {
    setHostOk(isTurnstileProductionHost(window.location.hostname));
  }, []);

  const enabled = Boolean(TURNSTILE_SITE_KEY) && hostOk;

  const renderWidget = useCallback(() => {
    if (!enabled || !containerRef.current || widgetIdRef.current !== null || !window.turnstile) {
      return false;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action: TURNSTILE_ENQUIRY_ACTION,
      appearance: 'always',
      callback: (value) => {
        setLoadError(false);
        setToken(value);
      },
      'error-callback': () => setLoadError(true),
    });
    return true;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled || widgetIdRef.current !== null) return;
      if (!renderWidget()) window.setTimeout(tick, 100);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [enabled, renderWidget]);

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

  const field = enabled ? (
    <div className="space-y-1">
      <div ref={containerRef} className="min-h-[65px]" />
      {loadError ? (
        <p className="text-sm text-red-700" role="alert">
          Security check failed to load. Refresh the page and try again.
        </p>
      ) : null}
    </div>
  ) : null;

  return {
    enabled,
    token,
    reset,
    script,
    field,
  };
}
