import { currencyFromCountry } from '@/lib/currency/catalog';
import { countryCodeFromHeaders, isRs101PaidCountry } from '@/lib/consultation/rs101-eligibility';

/** Body of /api/currency/suggest (also answered straight from cloudflare/worker.ts). */
export function currencySuggestion(headers: { get(name: string): string | null }) {
  const countryCode = countryCodeFromHeaders(headers);
  return {
    currency: countryCode
      ? suggestCurrencyFromCountryCode(countryCode)
      : suggestCurrencyFromLanguage(headers.get('accept-language') || 'en-IN'),
    country: countryCode,
    rs101_paid: isRs101PaidCountry(countryCode),
  };
}

/** Browser language / Accept-Language → storefront currency (no network). */
export function suggestCurrencyFromLanguage(acceptLanguage: string): string {
  const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? '';
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
  if (primary.includes('-ch') || primary.startsWith('de-ch') || primary.startsWith('fr-ch')) return 'CHF';
  if (primary.startsWith('de') || primary.startsWith('fr') || primary.startsWith('es') || primary.startsWith('it')) {
    return 'EUR';
  }
  if (primary.startsWith('ja')) return 'JPY';
  return 'INR';
}

/** Best-effort from a country code (tests / optional headers). */
export function suggestCurrencyFromCountryCode(country: string | null | undefined): string {
  if (!country || country === 'XX' || country === 'T1') return 'INR';
  return currencyFromCountry(country);
}
