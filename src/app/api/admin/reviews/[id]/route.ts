import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';

const reviewActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'feature', 'unfeature']),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const parsed = reviewActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid moderation action' }, { status: 400 });

  const update =
    parsed.data.action === 'approve'
      ? { is_approved: true }
      : parsed.data.action === 'reject'
      ? { is_approved: false, is_featured: false }
      : parsed.data.action === 'feature'
      ? { is_featured: true, is_approved: true }
      : { is_featured: false };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('reviews')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });

  void logAdminAction({
    userId: auth.user.id,
    action: `review_${parsed.data.action}`,
    resourceType: 'review',
    resourceId: id,
    details: update,
  });

  return NextResponse.json({ review: data });
}