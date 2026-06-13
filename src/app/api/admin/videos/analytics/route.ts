import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildDailyTrend } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const [{ data: categories }, { data: videos }] = await Promise.all([
    admin.from('video_categories').select('id, title, is_active, created_at').limit(500),
    admin.from('videos').select('category_id, is_featured, is_active, created_at, published_at').limit(5000),
  ]);

  const catRows = categories ?? [];
  const videoRows = videos ?? [];
  const videosByCategory = new Map<string, number>();
  for (const video of videoRows) {
    const key = video.category_id ?? 'uncategorized';
    videosByCategory.set(key, (videosByCategory.get(key) ?? 0) + 1);
  }

  return NextResponse.json({
    summary: {
      totalCategories: catRows.length,
      activeCategories: catRows.filter((row) => row.is_active).length,
      totalVideos: videoRows.length,
      activeVideos: videoRows.filter((row) => row.is_active).length,
      featuredVideos: videoRows.filter((row) => row.is_featured).length,
      uncategorizedVideos: videoRows.filter((row) => !row.category_id).length,
    },
    trend: buildDailyTrend(videoRows.map((row) => ({ created_at: row.created_at, total: 0 })), 30),
    categoryBreakdown: [
      ...catRows.map((row) => ({ label: row.title, value: videosByCategory.get(row.id) ?? 0, meta: 0 })),
      { label: 'Uncategorized', value: videosByCategory.get('uncategorized') ?? 0, meta: 0 },
    ].sort((a, b) => b.value - a.value),
    statusBreakdown: [
      { label: 'Active', value: videoRows.filter((row) => row.is_active).length, meta: 0 },
      { label: 'Inactive', value: videoRows.filter((row) => !row.is_active).length, meta: 0 },
      { label: 'Featured', value: videoRows.filter((row) => row.is_featured).length, meta: 0 },
    ],
  });
}
