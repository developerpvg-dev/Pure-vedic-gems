import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/metals — Public endpoint returning active metals with prices.
 * Used by the configurator MetalSizeSelector.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('metals')
      .select('id, name, slug, purity, price_per_gram, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=150' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
