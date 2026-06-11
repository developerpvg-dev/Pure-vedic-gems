import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';

const categoryReviewUpdateSchema = z.object({
  customer_name: z.string().trim().min(2).max(200).optional(),
  customer_location: z.string().trim().max(100).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(200).optional().nullable(),
  review_text: z.string().trim().min(10).max(2000).optional(),
  images: z.array(z.string().url()).max(6).optional(),
  is_verified: z.boolean().optional(),
  is_approved: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const parsed = categoryReviewUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('category_reviews')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to update category review' }, { status: 500 });

  void logAdminAction({
    userId: auth.user.id,
    action: 'category_review_update',
    resourceType: 'category_review',
    resourceId: id,
    details: parsed.data,
  });

  return NextResponse.json({ review: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from('category_reviews').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete category review' }, { status: 500 });

  void logAdminAction({
    userId: auth.user.id,
    action: 'category_review_delete',
    resourceType: 'category_review',
    resourceId: id,
  });

  return NextResponse.json({ success: true });
}
