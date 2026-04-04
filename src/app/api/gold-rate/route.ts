import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { GoldRateData } from '@/lib/types/configurator';

/**
 * GET /api/gold-rate
 * Returns current metal rates. Cached for 1 hour via ISR headers.
 * Reads from the `metals` table (admin-managed prices).
 * Falls back to `gold_rate_cache` table, then to hardcoded defaults.
 */

const DEFAULT_RATES: GoldRateData = {
  gold_22k_per_gram: 7200,
  gold_18k_per_gram: 5900,
  silver_per_gram: 95,
  panchdhatu_per_gram: 350,
  platinum_per_gram: 3200,
  fetched_at: new Date().toISOString(),
};

// Map metals table slugs to GoldRateData keys
const SLUG_TO_KEY: Record<string, keyof GoldRateData> = {
  gold_22k: 'gold_22k_per_gram',
  gold_18k: 'gold_18k_per_gram',
  silver_925: 'silver_per_gram',
  panchdhatu: 'panchdhatu_per_gram',
  platinum: 'platinum_per_gram',
};

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Try reading from the new `metals` table first
    const { data: metals, error: metalsError } = await supabase
      .from('metals')
      .select('slug, price_per_gram, updated_at')
      .eq('is_active', true);

    if (!metalsError && metals && metals.length > 0) {
      const response: GoldRateData = { ...DEFAULT_RATES };
      let latestUpdated = '';

      for (const metal of metals) {
        const key = SLUG_TO_KEY[metal.slug];
        if (key && key !== 'fetched_at') {
          (response as unknown as Record<string, number | string>)[key] = metal.price_per_gram;
        }
        if (metal.updated_at > latestUpdated) {
          latestUpdated = metal.updated_at;
        }
      }

      response.fetched_at = latestUpdated || new Date().toISOString();

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        },
      });
    }

    // Fallback: read from legacy gold_rate_cache table
    const { data, error } = await supabase
      .from('gold_rate_cache')
      .select('gold_22k_per_gram, gold_18k_per_gram, silver_per_gram, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(DEFAULT_RATES, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        },
      });
    }

    const response: GoldRateData = {
      gold_22k_per_gram: data.gold_22k_per_gram,
      gold_18k_per_gram: data.gold_18k_per_gram ?? DEFAULT_RATES.gold_18k_per_gram,
      silver_per_gram: data.silver_per_gram ?? DEFAULT_RATES.silver_per_gram,
      panchdhatu_per_gram: Math.round(data.gold_22k_per_gram * 0.05),
      platinum_per_gram: Math.round(data.gold_22k_per_gram * 0.45),
      fetched_at: data.fetched_at,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (err) {
    console.error('[gold-rate] Failed to fetch rates:', err);
    return NextResponse.json(DEFAULT_RATES, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  }
}
