'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  STOREFRONT_CURRENCIES,
  isStorefrontCurrency,
  type StorefrontCurrency,
} from '@/lib/currency/catalog';
import {
  getCurrencyDisplayState,
  setCurrencyDisplay,
  subscribeCurrencyDisplay,
} from '@/lib/currency/display-store';
import { suggestCurrencyFromLanguage } from '@/lib/currency/geo';
import { formatPrice } from '@/lib/utils/format';

/** First visit: IP country from /api/currency/suggest, else browser language. */
async function resolveSuggestedCurrency(): Promise<string> {
  try {
    const res = await fetch('/api/currency/suggest', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { currency?: string };
      if (data.currency && isStorefrontCurrency(data.currency)) return data.currency;
    }
  } catch {
    // fall through
  }
  return suggestCurrencyFromLanguage(navigator.language || 'en-IN');
}

const STORAGE_KEY = 'pvg_currency';

type CurrencyContextValue = {
  currency: string;
  currencies: StorefrontCurrency[];
  rates: Record<string, number>;
  ready: boolean;
  setCurrency: (code: string) => void;
  format: (amountInr: number) => string;
  /** When false, selection is display-only disabled (admin). */
  interactive: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/** Stable getServerSnapshot — inline object literals re-render forever. */
const SERVER_CURRENCY_SNAPSHOT = {
  enabled: false,
  currency: 'INR',
  rates: { INR: 1 },
};

function getServerCurrencySnapshot() {
  return SERVER_CURRENCY_SNAPSHOT;
}

function ratesFromPayload(rows: Array<{ currency: string; rate: number; is_active?: boolean }>) {
  const rates: Record<string, number> = { INR: 1 };
  for (const row of rows) {
    if (row.is_active === false) continue;
    const code = String(row.currency).toUpperCase();
    const rate = Number(row.rate);
    if (code && Number.isFinite(rate) && rate > 0) rates[code] = rate;
  }
  return rates;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const snapshot = useSyncExternalStore(
    subscribeCurrencyDisplay,
    getCurrencyDisplayState,
    getServerCurrencySnapshot
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const saved = localStorage.getItem(STORAGE_KEY)?.toUpperCase() ?? null;
      let rates: Record<string, number> = { INR: 1 };

      const [ratesRes, suggested] = await Promise.all([
        fetch('/api/currency/rates')
          .then(async (res) => {
            if (!res.ok) return null;
            return (await res.json()) as {
              rates?: Array<{ currency: string; rate: number; is_active?: boolean }>;
            };
          })
          .catch(() => null),
        // Only hit geo when the visitor has no saved pick.
        saved && isStorefrontCurrency(saved)
          ? Promise.resolve(saved)
          : resolveSuggestedCurrency(),
      ]);

      if (ratesRes?.rates) rates = ratesFromPayload(ratesRes.rates);
      if (cancelled) return;

      const next =
        saved && isStorefrontCurrency(saved)
          ? saved
          : isStorefrontCurrency(suggested)
            ? suggested
            : 'INR';

      setCurrencyDisplay({ enabled: true, currency: next, rates });
      setReady(true);
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((code: string) => {
    const next = code.toUpperCase();
    if (!isStorefrontCurrency(next)) return;
    localStorage.setItem(STORAGE_KEY, next);
    setCurrencyDisplay({ currency: next });
  }, []);

  const format = useCallback(
    (amountInr: number) => formatPrice(amountInr),
    [snapshot.currency, snapshot.rates]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency: snapshot.currency,
      currencies: STOREFRONT_CURRENCIES,
      rates: snapshot.rates,
      ready,
      setCurrency,
      format,
      interactive: true,
    }),
    [snapshot.currency, snapshot.rates, ready, setCurrency, format]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  // Always subscribe so hook order is stable; storefront provider value wins.
  useSyncExternalStore(
    subscribeCurrencyDisplay,
    getCurrencyDisplayState,
    getServerCurrencySnapshot
  );

  if (ctx) return ctx;

  // Outside provider (admin): always format as INR, ignore display store
  return {
    currency: 'INR',
    currencies: STOREFRONT_CURRENCIES,
    rates: { INR: 1 },
    ready: true,
    setCurrency: () => undefined,
    format: (amountInr: number) => formatPrice(amountInr, 'INR'),
    interactive: false,
  };
}

/** Subscribe so a client component re-renders when display currency/rates change. */
export function useCurrencySubscription() {
  return useSyncExternalStore(
    subscribeCurrencyDisplay,
    getCurrencyDisplayState,
    getServerCurrencySnapshot
  );
}
