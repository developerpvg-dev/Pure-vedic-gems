import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { productFiltersSchema } from '@/lib/validators/product';
import type { ProductListResponse } from '@/lib/types/product';

// Card-level columns to select (avoid fetching full descriptions for listing)
const CARD_SELECT = `
  id, slug, name, category, sub_category, price, price_per_carat, compare_price,
  carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url,
  in_stock, featured, is_directors_pick, treatment, planet, created_at
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawParams = Object.fromEntries(searchParams.entries());

    // Validate query params
    const parsed = productFiltersSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const filters = parsed.data;
    const supabase = await createClient();

    // Build query with dynamic filters
    let query = supabase
      .from('products')
      .select(CARD_SELECT, { count: 'exact' })
      .eq('is_active', true)
      .eq('in_stock', true);

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.sub_category) {
      query = query.eq('sub_category', filters.sub_category);
    }
    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }
    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }
    if (filters.min_carat !== undefined) {
      query = query.gte('carat_weight', filters.min_carat);
    }
    if (filters.max_carat !== undefined) {
      query = query.lte('carat_weight', filters.max_carat);
    }
    if (filters.origin) {
      query = query.eq('origin', filters.origin);
    }
    if (filters.planet) {
      query = query.eq('planet', filters.planet);
    }
    if (filters.certification) {
      query = query.eq('certification', filters.certification);
    }
    if (filters.treatment) {
      query = query.eq('treatment', filters.treatment);
    }

    // Sorting
    const sortColumn =
      filters.sort_by === 'price'
        ? 'price'
        : filters.sort_by === 'carat'
          ? 'carat_weight'
          : 'created_at';
    const ascending = filters.sort_order === 'asc';
    query = query.order(sortColumn, { ascending });

    // Pagination
    const page = filters.page;
    const perPage = filters.per_page;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: products, count, error } = await query;

    if (error) {
      console.error('Products query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const response: ProductListResponse = {
      products: products ?? [],
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
