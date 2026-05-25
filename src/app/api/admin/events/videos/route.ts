import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractYouTubeId, slugify } from '@/lib/utils/content-management';

const videoSchema = z.object({
  category_id: z.string().uuid(),
  title: z.string().trim().min(2).max(220),
  slug: z.string().trim().max(260).optional(),
  youtube_url: z.string().trim().min(3).max(500),
  legacy_url: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  sort_order: z.number().int().optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const categoryId = request.nextUrl.searchParams.get('category_id');
  const admin = createAdminClient();
  let query = admin
    .from('event_videos')
    .select('*, event_video_categories(id, title, slug)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: 'Failed to load event videos' }, { status: 500 });
  return NextResponse.json({ videos: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const parsed = videoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid video details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const youtubeId = extractYouTubeId(parsed.data.youtube_url);
  if (!youtubeId) return NextResponse.json({ error: 'Enter a valid YouTube URL or video ID' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('event_videos')
    .insert({
      category_id: parsed.data.category_id,
      title: parsed.data.title,
      slug: parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title),
      youtube_url: `https://www.youtube.com/watch?v=${youtubeId}`,
      youtube_id: youtubeId,
      legacy_url: parsed.data.legacy_url || null,
      description: parsed.data.description || null,
      sort_order: parsed.data.sort_order ?? 0,
      is_featured: parsed.data.is_featured ?? false,
      is_active: parsed.data.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Video slug already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create event video' }, { status: 500 });
  }

  return NextResponse.json({ video: data }, { status: 201 });
}
