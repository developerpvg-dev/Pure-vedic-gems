import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils/content-management';

const publicAssetOrUrl = z.string().trim().max(1000).refine(
  (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
  'Enter an absolute URL or a local public path starting with /',
);

const certificateSchema = z.object({
  name: z.string().trim().min(2).max(220),
  slug: z.string().trim().max(260).optional(),
  lab_name: z.string().trim().max(220).optional().nullable(),
  certificate_url: publicAssetOrUrl,
  thumbnail_url: publicAssetOrUrl.optional().nullable().or(z.literal('')),
  description: z.string().trim().max(4000).optional().nullable(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lab_certificates')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load lab certificates' }, { status: 500 });
  return NextResponse.json({ certificates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const parsed = certificateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid certificate details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lab_certificates')
    .insert({
      ...parsed.data,
      slug: parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name),
      lab_name: parsed.data.lab_name || null,
      thumbnail_url: parsed.data.thumbnail_url || parsed.data.certificate_url,
      description: parsed.data.description || null,
      sort_order: parsed.data.sort_order ?? 0,
      is_active: parsed.data.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Certificate slug already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create lab certificate' }, { status: 500 });
  }

  return NextResponse.json({ certificate: data }, { status: 201 });
}
