import { NextRequest, NextResponse } from 'next/server';
import {
  suggestCurrencyFromCountryCode,
  suggestCurrencyFromLanguage,
} from '@/lib/currency/geo';
import { countryCodeFromHeaders, isRs101PaidCountry } from '@/lib/consultation/rs101-eligibility';

/** Private — per-visitor geo; do not CDN-cache. */
export async function GET(request: NextRequest) {
  const countryCode = countryCodeFromHeaders(request.headers);
  const currency = countryCode
    ? suggestCurrencyFromCountryCode(countryCode)
    : suggestCurrencyFromLanguage(request.headers.get('accept-language') || 'en-IN');

  return NextResponse.json(
    {
      currency,
      country: countryCode,
      rs101_paid: isRs101PaidCountry(countryCode),
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
