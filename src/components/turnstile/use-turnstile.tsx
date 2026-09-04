'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TURNSTILE_COMMENT_ACTION,
  TURNSTILE_ENQUIRY_ACTION,
} from '@/lib/enquiry/verify-turnstile';
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
      size?: 'normal' | 'compact';
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

type TurnstileOptions = {
  /** Smaller widget — use on dense forms (reco booking). */
  size?: 'normal' | 'compact';
  className?: string;
  action?: typeof TURNSTILE_ENQUIRY_ACTION | typeof TURNSTILE_COMMENT_ACTION | string;
};

export function useTurnstile(options: TurnstileOptions = {}) {
  const { size = 'normal', className = '', action = TURNSTILE_ENQUIRY_ACTION } = options;
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
      return;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action,
      appearance: 'always',
      size,
      callback: (value) => {
        setLoadError(false);
        setToken(value);
      },
      'error-callback': () => setLoadError(true),
    });
  }, [action, enabled, size]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled || widgetIdRef.current !== null) return;
      renderWidget();
      if (widgetIdRef.current === null) window.setTimeout(tick, 100);
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
    <div className={className ? `${className} space-y-1`.trim() : 'space-y-1'}>
      <div ref={containerRef} className={className ? 'reco-turnstile-slot' : 'min-h-[65px]'} />
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
