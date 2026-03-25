import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Product, ProductDetailResponse } from '@/lib/types/product';

// UUID v4 regex for differentiating slug vs UUID lookups
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Determine if lookup is by UUID or slug and run the appropriate typed query
    const isUuid = UUID_REGEX.test(id);
    const rawResult = await (
      isUuid
        ? supabase.from('products').select('*').eq('id', id).eq('is_active', true).single()
        : supabase.from('products').select('*').eq('slug', id).eq('is_active', true).single()
    );
    const product = rawResult.data as Product | null;
    const error = rawResult.error;

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch related products: same category, similar price range (±50%), exclude current, limit 4
    const priceMin = product.price * 0.5;
    const priceMax = product.price * 1.5;

    const { data: relatedProducts } = await supabase
      .from('products')
      .select(
        'id, slug, name, category, sub_category, price, price_per_carat, compare_price, carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url, in_stock, featured, is_directors_pick, treatment, planet, created_at'
      )
      .eq('category', product.category)
      .eq('is_active', true)
      .eq('in_stock', true)
      .neq('id', product.id)
      .gte('price', priceMin)
      .lte('price', priceMax)
      .limit(4);

    // Fetch expert details if linked
    let expert = null;
    if (product.expert_id) {
      const { data: expertData } = await supabase
        .from('experts')
        .select('id, name, title, photo_url, specialty, rating')
        .eq('id', product.expert_id)
        .single();
      expert = expertData;
    }

    // Fetch review summary
    const { data: reviewsRaw } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', product.id)
      .eq('is_approved', true);
    const reviews = reviewsRaw as { rating: number | null }[] | null;

    const totalReviews = reviews?.length ?? 0;
    const averageRating =
      totalReviews > 0
        ? reviews!.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews
        : 0;

    const response: ProductDetailResponse = {
      product,
      related_products: relatedProducts ?? [],
      expert,
      review_summary: {
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: totalReviews,
      },
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
