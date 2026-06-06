import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils/content-management';

const categorySchema = z.object({
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().max(220).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('video_categories')
    .select('*, videos(id)')
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load video categories' }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid category details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title);
  if (!slug) return NextResponse.json({ error: 'Slug could not be generated' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('video_categories')
    .insert({
      title: parsed.data.title,
      slug,
      description: parsed.data.description || null,
      sort_order: parsed.data.sort_order ?? 0,
      is_active: parsed.data.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create video category' }, { status: 500 });
  }

  return NextResponse.json({ category: data }, { status: 201 });
}
