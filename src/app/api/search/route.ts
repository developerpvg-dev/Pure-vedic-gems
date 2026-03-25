import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchQuerySchema } from '@/lib/validators/product';
import type { SearchResponse } from '@/lib/types/product';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawParams = Object.fromEntries(searchParams.entries());

    // Validate
    const parsed = searchQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid search query', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { q } = parsed.data;
    const supabase = await createClient();

    // Use PostgreSQL full-text search with ts_query
    // Search across: name, vedic_name, origin, planet, short_desc
    // Using ilike as fallback for environments without tsvector columns configured
    const searchTerm = `%${q}%`;

    const { data: results, error } = await supabase
      .from('products')
      .select('id, slug, name, category, price, thumbnail_url, origin, planet')
      .eq('is_active', true)
      .or(
        `name.ilike.${searchTerm},vedic_name.ilike.${searchTerm},origin.ilike.${searchTerm},planet.ilike.${searchTerm},short_desc.ilike.${searchTerm}`
      )
      .order('featured', { ascending: false })
      .order('price', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Search query error:', error);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    const response: SearchResponse = {
      results: results ?? [],
      query: q,
      total: results?.length ?? 0,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
