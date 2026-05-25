import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils/content-management';

const publicAssetOrUrl = z.string().trim().max(1000).refine(
  (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
  'Enter an absolute URL or a local public path starting with /',
);

const optionalPublicAssetOrUrl = publicAssetOrUrl.optional().nullable().or(z.literal(''));
const optionalUrl = z.string().trim().url().max(1000).optional().nullable().or(z.literal(''));

const testimonialUpdateSchema = z.object({
  name: z.string().trim().min(2).max(180).optional(),
  slug: z.string().trim().max(220).optional(),
  location: z.string().trim().max(180).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(220).optional().nullable(),
  message: z.string().trim().min(10).max(6000).optional(),
  proof_image_url: optionalPublicAssetOrUrl,
  proof_alt: z.string().trim().max(260).optional().nullable(),
  source_url: optionalUrl,
  status: z.enum(['draft', 'approved', 'hidden']).optional(),
  is_active: z.boolean().optional(),
  show_on_homepage: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  published_at: z.string().trim().datetime().optional().nullable().or(z.literal('')),
});

function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const parsed = testimonialUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid testimonial update', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
  if (parsed.data.slug) updates.slug = slugify(parsed.data.slug);
  if ('location' in parsed.data) updates.location = emptyToNull(parsed.data.location);
  if ('title' in parsed.data) updates.title = emptyToNull(parsed.data.title);
  if ('proof_image_url' in parsed.data) updates.proof_image_url = emptyToNull(parsed.data.proof_image_url || null);
  if ('proof_alt' in parsed.data) updates.proof_alt = emptyToNull(parsed.data.proof_alt);
  if ('source_url' in parsed.data) updates.source_url = emptyToNull(parsed.data.source_url || null);
  if ('published_at' in parsed.data && !parsed.data.published_at) delete updates.published_at;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('testimonials')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  return NextResponse.json({ testimonial: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from('testimonials')
    .update({ is_active: false, show_on_homepage: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to deactivate testimonial' }, { status: 500 });
  return NextResponse.json({ success: true });
}