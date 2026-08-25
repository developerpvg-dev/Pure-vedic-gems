import { NextRequest, NextResponse } from 'next/server';
import {
  suggestCurrencyFromCountryCode,
  suggestCurrencyFromLanguage,
} from '@/lib/currency/geo';

/** Private — per-visitor geo; do not CDN-cache. */
export async function GET(request: NextRequest) {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry');

  const currency = country
    ? suggestCurrencyFromCountryCode(country)
    : suggestCurrencyFromLanguage(request.headers.get('accept-language') || 'en-IN');

  return NextResponse.json(
    { currency, country: country?.toUpperCase() ?? null },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
