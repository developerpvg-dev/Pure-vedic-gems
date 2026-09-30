import { NextRequest, NextResponse } from 'next/server';
import { currencySuggestion } from '@/lib/currency/geo';

/** Private — per-visitor geo; do not CDN-cache. In production cloudflare/worker.ts answers this before Next. */
export async function GET(request: NextRequest) {
  return NextResponse.json(currencySuggestion(request.headers), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
