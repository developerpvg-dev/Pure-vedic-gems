'use client';

import { useEffect, useState } from 'react';

export type SuggestPayload = { currency?: string; rs101_paid?: boolean };

const SUGGEST_KEY = 'pvg_currency_suggest_v1';
let suggestPromise: Promise<SuggestPayload | null> | null = null;

/**
 * One /api/currency/suggest call per tab: every price label, CTA and the currency provider share it.
 * ponytail: cached for the whole session, so a visitor who switches VPN country mid-session keeps the first answer.
 */
export function fetchCurrencySuggest(): Promise<SuggestPayload | null> {
  if (suggestPromise) return suggestPromise;
  try {
    const raw = sessionStorage.getItem(SUGGEST_KEY);
    if (raw) return (suggestPromise = Promise.resolve(JSON.parse(raw) as SuggestPayload));
  } catch {
    // sessionStorage unavailable — fall through to network
  }
  suggestPromise = fetch('/api/currency/suggest', { cache: 'no-store' })
    .then(async (res) => (res.ok ? ((await res.json()) as SuggestPayload) : null))
    .then((data) => {
      if (data) {
        try {
          sessionStorage.setItem(SUGGEST_KEY, JSON.stringify(data));
        } catch {
          // ignore
        }
      } else {
        suggestPromise = null;
      }
      return data;
    })
    .catch(() => {
      suggestPromise = null;
      return null;
    });
  return suggestPromise;
}

/** Client geo for forms / CTAs without a server `rs101Paid` prop. Defaults paid until loaded. */
export function useRs101Eligibility() {
  const [paid, setPaid] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchCurrencySuggest().then((data) => {
      if (cancelled) return;
      setPaid(data?.rs101_paid ?? true);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { paid, ready, free: !paid };
}
