import { NextResponse } from 'next/server';
import { getCachedStorefrontRates } from '@/lib/currency/cached-rates';

/** Rates served from Data Cache; bust only when admin saves / Update from API. */
export async function GET() {
  const payload = await getCachedStorefrontRates();

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=86400',
    },
  });
}
