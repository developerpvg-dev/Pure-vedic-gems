import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown, buildDailyTrend, buildRatingBreakdown } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('testimonials')
    .select('status, rating, is_active, show_on_homepage, proof_image_url, location, created_at, published_at')
    .limit(5000);

  if (error) return NextResponse.json({ error: 'Failed to load testimonial analytics' }, { status: 500 });

  const rows = data ?? [];
  const ratings = rows.map((row) => Number(row.rating ?? 0)).filter((value) => value > 0);

  return NextResponse.json({
    summary: {
      totalTestimonials: rows.length,
      approved: rows.filter((row) => row.status === 'approved').length,
      draft: rows.filter((row) => row.status === 'draft').length,
      hidden: rows.filter((row) => row.status === 'hidden').length,
      onHomepage: rows.filter((row) => row.show_on_homepage).length,
      withProof: rows.filter((row) => row.proof_image_url).length,
      avgRating: ratings.length ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10 : 0,
    },
    trend: buildDailyTrend(rows.map((row) => ({ created_at: row.created_at, total: row.rating ?? 0 })), 30),
    statusBreakdown: buildBreakdown(rows, 'status'),
    ratingBreakdown: buildRatingBreakdown(rows),
    placementBreakdown: [
      { label: 'Homepage', value: rows.filter((row) => row.show_on_homepage).length, meta: 0 },
      { label: 'With proof image', value: rows.filter((row) => row.proof_image_url).length, meta: 0 },
      { label: 'Active', value: rows.filter((row) => row.is_active).length, meta: 0 },
    ],
  });
}
