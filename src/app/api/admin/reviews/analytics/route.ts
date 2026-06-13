import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildDailyTrend, buildRatingBreakdown } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('reviews')
    .select('rating, is_approved, is_featured, is_verified, created_at')
    .limit(5000);

  if (error) return NextResponse.json({ error: 'Failed to load review analytics' }, { status: 500 });

  const rows = data ?? [];
  const ratings = rows.map((row) => Number(row.rating ?? 0)).filter((value) => value > 0);
  const avgRating = ratings.length ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10 : 0;

  return NextResponse.json({
    summary: {
      totalReviews: rows.length,
      pending: rows.filter((row) => !row.is_approved).length,
      approved: rows.filter((row) => row.is_approved).length,
      featured: rows.filter((row) => row.is_featured).length,
      verified: rows.filter((row) => row.is_verified).length,
      avgRating,
    },
    trend: buildDailyTrend(rows.map((row) => ({ created_at: row.created_at, total: row.rating ?? 0 })), 30),
    ratingBreakdown: buildRatingBreakdown(rows),
    moderationBreakdown: [
      { label: 'Pending', value: rows.filter((row) => !row.is_approved).length, meta: 0 },
      { label: 'Approved', value: rows.filter((row) => row.is_approved && !row.is_featured).length, meta: 0 },
      { label: 'Featured', value: rows.filter((row) => row.is_featured).length, meta: 0 },
      { label: 'Verified', value: rows.filter((row) => row.is_verified).length, meta: 0 },
    ],
  });
}
