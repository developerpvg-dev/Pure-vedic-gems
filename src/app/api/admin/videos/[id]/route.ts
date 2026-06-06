import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractYouTubeId, slugify } from '@/lib/utils/content-management';

const videoUpdateSchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(2).max(300).optional(),
  slug: z.string().trim().max(300).optional(),
  youtube_url: z.string().trim().min(3).max(500).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  legacy_url: z.string().trim().max(500).optional().nullable(),
  seo_title: z.string().trim().max(300).optional().nullable(),
  seo_description: z.string().trim().max(400).optional().nullable(),
  sort_order: z.number().int().optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const parsed = videoUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid video details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
  if (parsed.data.slug) updates.slug = slugify(parsed.data.slug);
  if (parsed.data.youtube_url) {
    const youtubeId = extractYouTubeId(parsed.data.youtube_url);
    if (!youtubeId) return NextResponse.json({ error: 'Enter a valid YouTube URL or video ID' }, { status: 400 });
    updates.youtube_id = youtubeId;
    updates.youtube_url = `https://www.youtube.com/watch?v=${youtubeId}`;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('videos').update(updates).eq('id', id).select('*').single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Video slug already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
  return NextResponse.json({ video: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from('videos')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to deactivate video' }, { status: 500 });
  return NextResponse.json({ success: true });
}
