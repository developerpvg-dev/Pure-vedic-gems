/**
 * Live FX from fawazahmed0/currency-api (listed on public-apis):
 * free, no API key, no rate limits.
 * Response: how many of each currency per 1 INR → we store 1 FX = N INR.
 */

import { FX_CURRENCY_CODES } from '@/lib/currency/catalog';

const ENDPOINTS = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.json',
  'https://latest.currency-api.pages.dev/v1/currencies/inr.json',
];

export type LiveRateMap = Record<string, number>;

export async function fetchLiveRatesToInr(
  codes: readonly string[] = FX_CURRENCY_CODES
): Promise<{ rates: LiveRateMap; date: string | null; source: string }> {
  let lastError: Error | null = null;

  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { date?: string; inr?: Record<string, number> };
      const inr = body.inr;
      if (!inr || typeof inr !== 'object') throw new Error('Unexpected FX payload');

      const rates: LiveRateMap = { INR: 1 };
      for (const code of codes) {
        const key = code.toLowerCase();
        const perInr = Number(inr[key]);
        if (!Number.isFinite(perInr) || perInr <= 0) continue;
        rates[code.toUpperCase()] = 1 / perInr;
      }
      return { rates, date: body.date ?? null, source: 'fawazahmed0/currency-api' };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('Failed to fetch live currency rates');
}
