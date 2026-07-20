/**
 * Display-currency store for storefront conversion.
 * Rates mean: 1 foreign unit = N INR (same as currency_rates.rate).
 * Conversion only runs when `enabled` (CurrencyProvider on storefront).
 */

type CurrencyDisplayState = {
  enabled: boolean;
  currency: string;
  /** 1 FX = N INR */
  rates: Record<string, number>;
};

let state: CurrencyDisplayState = {
  enabled: false,
  currency: 'INR',
  rates: { INR: 1 },
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function getCurrencyDisplayState(): CurrencyDisplayState {
  return state;
}

export function subscribeCurrencyDisplay(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setCurrencyDisplay(next: Partial<CurrencyDisplayState>) {
  state = {
    enabled: next.enabled ?? state.enabled,
    currency: next.currency ?? state.currency,
    rates: next.rates ?? state.rates,
  };
  emit();
}

/** Convert an INR amount into the display (or given) currency. */
export function convertFromInr(amountInr: number, currency?: string): number {
  const code = (currency ?? state.currency).toUpperCase();
  if (!Number.isFinite(amountInr)) return 0;
  if (!state.enabled || code === 'INR') return amountInr;
  const rate = state.rates[code];
  if (!rate || rate <= 0) return amountInr;
  return amountInr / rate;
}

export function localeForCurrency(code: string): string {
  switch (code.toUpperCase()) {
    case 'INR':
      return 'en-IN';
    case 'EUR':
      return 'de-DE';
    case 'GBP':
      return 'en-GB';
    case 'AED':
    case 'QAR':
    case 'SAR':
      return 'en-AE';
    case 'JPY':
      return 'ja-JP';
    default:
      return 'en-US';
  }
}
