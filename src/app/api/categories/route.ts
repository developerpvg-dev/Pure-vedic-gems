import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/categories
 * Public endpoint — returns active gem categories.
 * Supports ?type=navaratna|upratna filter.
 * Cached for 5 minutes via ISR.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');

  const supabase = createAdminClient();

  let query = supabase
    .from('gem_categories')
    .select('id, name, slug, type, sanskrit_name, planet, emoji, color, image_url, hover_image_url, description, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (type === 'navaratna' || type === 'upratna') {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[categories] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }

  return NextResponse.json(
    { categories: data ?? [] },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=150',
      },
    }
  );
}
