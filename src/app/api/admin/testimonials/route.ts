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

const testimonialSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: z.string().trim().max(220).optional(),
  location: z.string().trim().max(180).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(220).optional().nullable(),
  message: z.string().trim().min(10).max(6000),
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

function payloadFromInput(input: z.infer<typeof testimonialSchema>) {
  return {
    name: input.name,
    slug: slugify(input.slug || input.name),
    location: emptyToNull(input.location),
    rating: input.rating ?? 5,
    title: emptyToNull(input.title),
    message: input.message,
    proof_image_url: emptyToNull(input.proof_image_url || null),
    proof_alt: emptyToNull(input.proof_alt),
    source_url: emptyToNull(input.source_url || null),
    status: input.status ?? 'approved',
    is_active: input.is_active ?? true,
    show_on_homepage: input.show_on_homepage ?? false,
    sort_order: input.sort_order ?? 0,
    published_at: input.published_at || new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const status = request.nextUrl.searchParams.get('status');
  const admin = createAdminClient();
  let query = admin
    .from('testimonials')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })
    .limit(200);

  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: 'Failed to load testimonials' }, { status: 500 });
  return NextResponse.json({ testimonials: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const parsed = testimonialSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid testimonial details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('testimonials')
    .insert(payloadFromInput(parsed.data))
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  return NextResponse.json({ testimonial: data }, { status: 201 });
}