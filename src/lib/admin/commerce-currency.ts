export type NormalizedCurrencyRate = {
  id: string | null;
  base_currency: string;
  currency: string;
  rate: number;
  manual_override: boolean;
  is_active: boolean;
  source: string | null;
  updated_at: string | null;
};

import { FX_CURRENCY_CODES } from '@/lib/currency/catalog';

export const FX_CURRENCY_OPTIONS = FX_CURRENCY_CODES;

export function normalizeCurrencyRate(row: Record<string, unknown>): NormalizedCurrencyRate {
  const currency = String(row.currency ?? '').toUpperCase();
  const rate = Number(row.rate ?? row.rate_to_inr ?? 0);

  return {
    id: row.id ? String(row.id) : null,
    base_currency: String(row.base_currency ?? 'INR').toUpperCase(),
    currency,
    rate: Number.isFinite(rate) ? rate : 0,
    manual_override: Boolean(row.manual_override),
    is_active: row.is_active !== false,
    source: row.source ? String(row.source) : null,
    updated_at: row.updated_at ? String(row.updated_at) : null,
  };
}

export function normalizeCurrencyRates(rows: unknown): NormalizedCurrencyRate[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => normalizeCurrencyRate(row as Record<string, unknown>))
    .filter((row) => row.currency)
    .sort((a, b) => {
      if (a.currency === 'INR') return -1;
      if (b.currency === 'INR') return 1;
      return a.currency.localeCompare(b.currency);
    });
}

export function formatCurrencyRateLabel(rate: NormalizedCurrencyRate) {
  if (rate.currency === 'INR') return '1 INR = ₹1.00 (base currency)';
  return `1 ${rate.currency} = ₹${rate.rate.toLocaleString('en-IN', { maximumFractionDigits: 4 })}`;
}

export function currencyRateKey(rate: NormalizedCurrencyRate) {
  return rate.id ?? rate.currency;
}
