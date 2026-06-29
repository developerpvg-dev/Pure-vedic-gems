/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils/content-management';

const publicAssetOrUrl = z.string().trim().max(1000).refine(
  (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
  'Enter an absolute URL or a local public path starting with /',
);

const heroSlideUpdateSchema = z.object({
  slug: z.string().trim().max(80).optional(),
  desktop_image_url: publicAssetOrUrl.optional(),
  mobile_image_url: publicAssetOrUrl.optional(),
  alt_text: z.string().trim().min(2).max(260).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

function revalidateHero() {
  revalidatePath('/');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const parsed = heroSlideUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid hero slide update', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.slug) {
    updates.slug = slugify(parsed.data.slug).slice(0, 80);
  }

  const admin = createAdminClient();
  const { data, error } = await (admin.from('hero_slides') as any)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A slide with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update hero slide' }, { status: 500 });
  }

  revalidateHero();
  return NextResponse.json({ slide: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await (admin.from('hero_slides') as any).delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete hero slide' }, { status: 500 });
  }

  revalidateHero();
  return NextResponse.json({ success: true });
}
