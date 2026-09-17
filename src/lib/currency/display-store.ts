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

/** Convert a display-currency amount back to INR (inverse of convertFromInr). */
export function convertToInr(amount: number, currency?: string): number {
  const code = (currency ?? state.currency).toUpperCase();
  if (!Number.isFinite(amount)) return 0;
  if (!state.enabled || code === 'INR') return amount;
  const rate = state.rates[code];
  if (!rate || rate <= 0) return amount;
  return amount * rate;
}

/**
 * Locale for currency price labels.
 *
 * Rule: always use an English locale whose decimal is `.` (never `,`).
 * European locales (de-DE, fr-FR, …) format €24.15 as "24,15 €", which
 * en-IN readers misread as 2415. Keep symbol regional where safe (en-IE/GB/AE).
 */
export function localeForCurrency(code: string): string {
  switch (code.toUpperCase()) {
    case 'INR':
      return 'en-IN';
    case 'EUR':
      return 'en-IE';
    case 'GBP':
      return 'en-GB';
    case 'AED':
    case 'QAR':
    case 'SAR':
      return 'en-AE';
    case 'CAD':
      return 'en-CA';
    case 'AUD':
      return 'en-AU';
    case 'SGD':
      return 'en-SG';
    case 'USD':
    case 'NPR':
    case 'JPY':
    case 'CHF':
    default:
      return 'en-US';
  }
}
