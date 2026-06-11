import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import { normalizeReviewCategory } from '@/lib/reviews/category-config';

const categoryReviewCreateSchema = z.object({
  category: z.string().trim().min(2).max(50),
  sub_category: z.string().trim().min(2).max(100),
  customer_name: z.string().trim().min(2).max(200),
  customer_location: z.string().trim().max(100).optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(200).optional().nullable(),
  review_text: z.string().trim().min(10).max(2000),
  images: z.array(z.string().url()).max(6).optional(),
  is_verified: z.boolean().optional(),
  is_approved: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category');
  const subCategory = searchParams.get('sub_category');
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from('category_reviews')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq('category', category);
  if (subCategory) query = query.eq('sub_category', subCategory);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch category reviews' }, { status: 500 });

  return NextResponse.json({
    reviews: data ?? [],
    total: count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const parsed = categoryReviewCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid category review', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('category_reviews')
    .insert({
      category: normalizeReviewCategory(parsed.data.category),
      sub_category: parsed.data.sub_category,
      customer_name: parsed.data.customer_name,
      customer_location: parsed.data.customer_location ?? null,
      rating: parsed.data.rating,
      title: parsed.data.title ?? null,
      review_text: parsed.data.review_text,
      images: parsed.data.images ?? [],
      is_verified: parsed.data.is_verified ?? false,
      is_approved: parsed.data.is_approved ?? true,
      is_active: parsed.data.is_active ?? true,
      is_featured: parsed.data.is_featured ?? false,
      source: 'admin',
    })
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to create category review' }, { status: 500 });

  const review = data as { id: string; category: string; sub_category: string };

  void logAdminAction({
    userId: auth.user.id,
    action: 'category_review_create',
    resourceType: 'category_review',
    resourceId: review.id,
    details: { category: review.category, sub_category: review.sub_category },
  });

  return NextResponse.json({ review: data }, { status: 201 });
}
