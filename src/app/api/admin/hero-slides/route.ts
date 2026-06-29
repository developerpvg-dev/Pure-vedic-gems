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

const heroSlideSchema = z.object({
  slug: z.string().trim().max(80).optional(),
  desktop_image_url: publicAssetOrUrl,
  mobile_image_url: publicAssetOrUrl,
  alt_text: z.string().trim().min(2).max(260),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

function revalidateHero() {
  revalidatePath('/');
}

export async function GET() {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await (admin.from('hero_slides') as any)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load hero slides' }, { status: 500 });
  }

  return NextResponse.json({ slides: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const parsed = heroSlideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid hero slide details', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const admin = createAdminClient();

  let sortOrder = input.sort_order;
  if (sortOrder === undefined) {
    const { data: last } = await (admin.from('hero_slides') as any)
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (last?.sort_order ?? 0) + 10;
  }

  const slug = slugify(input.slug || input.alt_text).slice(0, 80) || `hero-slide-${Date.now()}`;

  const { data, error } = await (admin.from('hero_slides') as any)
    .insert({
      slug,
      desktop_image_url: input.desktop_image_url,
      mobile_image_url: input.mobile_image_url,
      alt_text: input.alt_text,
      sort_order: sortOrder,
      is_active: input.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A slide with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create hero slide' }, { status: 500 });
  }

  revalidateHero();
  return NextResponse.json({ slide: data }, { status: 201 });
}
