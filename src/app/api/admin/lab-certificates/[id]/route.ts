import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils/content-management';

const publicAssetOrUrl = z.string().trim().max(1000).refine(
  (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
  'Enter an absolute URL or a local public path starting with /',
);

const certificateUpdateSchema = z.object({
  name: z.string().trim().min(2).max(220).optional(),
  slug: z.string().trim().max(260).optional(),
  lab_name: z.string().trim().max(220).optional().nullable(),
  certificate_url: publicAssetOrUrl.optional(),
  thumbnail_url: publicAssetOrUrl.optional().nullable().or(z.literal('')),
  description: z.string().trim().max(4000).optional().nullable(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const parsed = certificateUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid certificate details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
  if (parsed.data.slug) updates.slug = slugify(parsed.data.slug);
  if ('thumbnail_url' in parsed.data) updates.thumbnail_url = parsed.data.thumbnail_url || null;

  const admin = createAdminClient();
  const { data, error } = await admin.from('lab_certificates').update(updates).eq('id', id).select('*').single();

  if (error) return NextResponse.json({ error: 'Failed to update lab certificate' }, { status: 500 });
  return NextResponse.json({ certificate: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from('lab_certificates')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to deactivate lab certificate' }, { status: 500 });
  return NextResponse.json({ success: true });
}
