'use client';

import { useEffect, useState } from 'react';

type SuggestPayload = { rs101_paid?: boolean };

/** Client geo for forms / CTAs without a server `rs101Paid` prop. Defaults paid until loaded. */
export function useRs101Eligibility() {
  const [paid, setPaid] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/currency/suggest', { cache: 'no-store' })
      .then(async (res) => (res.ok ? ((await res.json()) as SuggestPayload) : null))
      .then((data) => {
        if (cancelled) return;
        setPaid(data?.rs101_paid ?? true);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { paid, ready, free: !paid };
}
