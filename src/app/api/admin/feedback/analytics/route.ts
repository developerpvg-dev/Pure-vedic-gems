import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown, buildDailyTrend, buildRatingBreakdown } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('feedback_submissions')
    .select('status, rating, allow_display, is_featured, created_at')
    .limit(5000);

  if (error) return NextResponse.json({ error: 'Failed to load feedback analytics' }, { status: 500 });

  const rows = data ?? [];
  const ratings = rows.map((row) => Number(row.rating ?? 0)).filter((value) => value > 0);
  const avgRating = ratings.length ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10 : 0;

  return NextResponse.json({
    summary: {
      totalFeedback: rows.length,
      pending: rows.filter((row) => row.status === 'pending').length,
      approved: rows.filter((row) => row.status === 'approved').length,
      rejected: rows.filter((row) => row.status === 'rejected').length,
      displayAllowed: rows.filter((row) => row.allow_display).length,
      featured: rows.filter((row) => row.is_featured).length,
      avgRating,
    },
    trend: buildDailyTrend(rows.map((row) => ({ created_at: row.created_at, total: row.rating ?? 0 })), 30),
    statusBreakdown: buildBreakdown(rows, 'status'),
    ratingBreakdown: buildRatingBreakdown(rows),
  });
}
