import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductReview } from '@/components/shop/ProductTabs';
import { normalizeReviewCategory, usesCategoryReviewPool } from '@/lib/reviews/category-config';

export { usesCategoryReviewPool };

export interface CategoryReviewRow {
  id: string;
  customer_name: string;
  customer_location: string | null;
  rating: number | null;
  title: string | null;
  review_text: string | null;
  images: unknown;
  is_verified: boolean;
  created_at: string;
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

export function shuffleForProduct<T>(items: T[], productId: string): T[] {
  if (items.length <= 1) return items;
  const rng = seededRandom(hashSeed(productId));
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function extractImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  const urls: string[] = [];
  for (const item of images) {
    if (typeof item === 'string') urls.push(item);
    else if (item && typeof item === 'object' && 'url' in item && typeof (item as { url: unknown }).url === 'string') {
      urls.push((item as { url: string }).url);
    }
  }
  return urls;
}

function toProductReview(row: CategoryReviewRow): ProductReview {
  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_location: row.customer_location,
    rating: row.rating,
    title: row.title,
    review_text: row.review_text,
    is_verified: row.is_verified,
    created_at: row.created_at,
    images: extractImageUrls(row.images),
  };
}

export async function fetchCategoryReviews(
  supabase: SupabaseClient,
  category: string,
  subCategory: string,
): Promise<CategoryReviewRow[]> {
  const normalizedCategory = normalizeReviewCategory(category);

  const { data } = await supabase
    .from('category_reviews')
    .select('id, customer_name, customer_location, rating, title, review_text, images, is_verified, created_at')
    .eq('category', normalizedCategory)
    .eq('sub_category', subCategory)
    .eq('is_approved', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (data ?? []) as CategoryReviewRow[];
}

export async function fetchProductSpecificReviews(
  supabase: SupabaseClient,
  productId: string,
): Promise<ProductReview[]> {
  const { data } = await supabase
    .from('reviews')
    .select('id, customer_name, customer_location, rating, title, review_text, images, is_verified, created_at')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return ((data ?? []) as Array<CategoryReviewRow & { images: unknown }>).map((row) => toProductReview(row));
}

export function mergeReviewsForProduct(
  productReviews: ProductReview[],
  categoryReviews: CategoryReviewRow[],
  productId: string,
): ProductReview[] {
  const seen = new Set<string>();
  const merged: ProductReview[] = [];

  for (const review of productReviews) {
    const key = review.review_text?.trim().toLowerCase() ?? review.id;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(review);
  }

  const shuffledCategory = shuffleForProduct(categoryReviews, productId).map(toProductReview);
  for (const review of shuffledCategory) {
    const key = review.review_text?.trim().toLowerCase() ?? review.id;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(review);
  }

  return merged;
}

export async function getDisplayReviewsForProduct(
  supabase: SupabaseClient,
  product: { id: string; category: string; sub_category?: string | null },
): Promise<ProductReview[]> {
  const productReviews = await fetchProductSpecificReviews(supabase, product.id);

  if (!usesCategoryReviewPool(product.category, product.sub_category)) {
    return productReviews;
  }

  const categoryReviews = await fetchCategoryReviews(
    supabase,
    product.category,
    product.sub_category!,
  );

  return mergeReviewsForProduct(productReviews, categoryReviews, product.id);
}
