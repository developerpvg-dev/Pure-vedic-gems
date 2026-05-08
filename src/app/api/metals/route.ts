import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

/**
 * GET /api/metals — public endpoint returning admin-managed metal prices.
 */
export async function GET() {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('metals')
      .select('id, name, slug, purity, price_per_gram, sort_order, updated_at')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
