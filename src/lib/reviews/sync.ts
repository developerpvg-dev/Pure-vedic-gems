import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeReviewCategory, usesCategoryReviewPool } from '@/lib/reviews/category-config';

type ReviewRow = {
  id: string;
  product_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_location: string | null;
  rating: number | null;
  title: string | null;
  review_text: string | null;
  images: unknown;
  is_verified: boolean;
};

type ProductRow = {
  category: string;
  sub_category: string | null;
};

export async function syncApprovedReviewToCategoryPool(
  admin: SupabaseClient,
  review: ReviewRow,
): Promise<void> {
  const { data: product } = await admin
    .from('products')
    .select('category, sub_category')
    .eq('id', review.product_id)
    .maybeSingle();

  const productRow = product as ProductRow | null;
  if (!productRow || !usesCategoryReviewPool(productRow.category, productRow.sub_category)) {
    return;
  }

  const normalizedCategory = normalizeReviewCategory(productRow.category);

  const { data: existing } = await admin
    .from('category_reviews')
    .select('id')
    .eq('source_review_id', review.id)
    .maybeSingle();

  const payload = {
    category: normalizedCategory,
    sub_category: productRow.sub_category!,
    customer_name: review.customer_name,
    customer_location: review.customer_location,
    rating: review.rating,
    title: review.title,
    review_text: review.review_text ?? '',
    images: review.images ?? [],
    is_verified: review.is_verified,
    is_approved: true,
    is_active: true,
    source: 'customer' as const,
    source_review_id: review.id,
    source_product_id: review.product_id,
    source_customer_id: review.customer_id,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await admin.from('category_reviews').update(payload).eq('id', existing.id);
    return;
  }

  await admin.from('category_reviews').insert(payload);
}
