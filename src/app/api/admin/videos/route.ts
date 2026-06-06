import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractYouTubeId, slugify } from '@/lib/utils/content-management';

const videoSchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(2).max(300),
  slug: z.string().trim().max(300).optional(),
  youtube_url: z.string().trim().min(3).max(500),
  description: z.string().trim().max(4000).optional().nullable(),
  legacy_url: z.string().trim().max(500).optional().nullable(),
  seo_title: z.string().trim().max(300).optional().nullable(),
  seo_description: z.string().trim().max(400).optional().nullable(),
  sort_order: z.number().int().optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('videos')
    .select('*, video_categories(title)')
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load videos' }, { status: 500 });
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

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title);
  if (!slug) return NextResponse.json({ error: 'Slug could not be generated' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('videos')
    .insert({
      category_id: parsed.data.category_id || null,
      title: parsed.data.title,
      slug,
      youtube_url: `https://www.youtube.com/watch?v=${youtubeId}`,
      youtube_id: youtubeId,
      description: parsed.data.description || null,
      legacy_url: parsed.data.legacy_url || null,
      seo_title: parsed.data.seo_title || `${parsed.data.title} | Pure Vedic Gems`.slice(0, 300),
      seo_description: parsed.data.seo_description || null,
      sort_order: parsed.data.sort_order ?? 0,
      is_featured: parsed.data.is_featured ?? false,
      is_active: parsed.data.is_active ?? true,
      published_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Video slug already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }

  return NextResponse.json({ video: data }, { status: 201 });
}
