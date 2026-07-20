import { headers } from 'next/headers';
import { currencyFromCountry } from '@/lib/currency/catalog';

/** Best-effort visitor country → currency (CDN headers, then Accept-Language). */
export async function suggestCurrencyFromRequest(): Promise<string> {
  const h = await headers();
  const country =
    h.get('x-vercel-ip-country') ||
    h.get('cf-ipcountry') ||
    h.get('x-country-code') ||
    null;

  if (country && country !== 'XX' && country !== 'T1') {
    return currencyFromCountry(country);
  }

  const accept = h.get('accept-language') ?? '';
  const primary = accept.split(',')[0]?.trim().toLowerCase() ?? '';
  if (primary.includes('-in') || primary.startsWith('hi')) return 'INR';
  if (primary.includes('-gb') || primary.startsWith('en-gb')) return 'GBP';
  if (primary.includes('-ae') || primary.includes('-qa') || primary.includes('-sa')) {
    if (primary.includes('-qa')) return 'QAR';
    if (primary.includes('-sa')) return 'SAR';
    return 'AED';
  }
  if (primary.includes('-us')) return 'USD';
  if (primary.includes('-au')) return 'AUD';
  if (primary.includes('-ca')) return 'CAD';
  if (primary.includes('-sg')) return 'SGD';
  if (primary.includes('-np') || primary.startsWith('ne')) return 'NPR';
  if (primary.startsWith('de') || primary.startsWith('fr') || primary.startsWith('es') || primary.startsWith('it')) {
    return 'EUR';
  }
  if (primary.startsWith('ja')) return 'JPY';
  return 'INR';
}
