import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { putPublicMediaObject } from '@/lib/media/r2';

const publicAssetOrUrl = z.string().trim().max(1000).refine(
  (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
  'Enter an absolute URL or a local public path starting with /',
);

const labSchema = z.object({
  name: z.string().trim().min(1).max(120),
  image_url: publicAssetOrUrl,
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db
    .from('storefront_lab_logos')
    .select('id, name, image_url, sort_order, is_active, created_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load lab logos' }, { status: 500 });
  return NextResponse.json({ labs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const contentType = request.headers.get('content-type') ?? '';

  // Multipart: create lab + upload image in one shot
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const file = form.get('file');
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: 'Image file is required' }, { status: 400 });

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Upload JPG, PNG, or WebP only' }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be 2MB or smaller' }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `lab-logos/${Date.now()}-${safeName}`;
    let imageUrl: string;
    try {
      imageUrl = await putPublicMediaObject({
        bucket: 'certificates',
        path,
        body: await file.arrayBuffer(),
        contentType: file.type,
      });
    } catch {
      return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    }

    const db = asUntypedSupabase(createAdminClient());
    const { data, error } = await db
      .from('storefront_lab_logos')
      .insert({ name, image_url: imageUrl, sort_order: 0, is_active: true })
      .select('id, name, image_url, sort_order, is_active, created_at')
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create lab logo' }, { status: 500 });
    return NextResponse.json({ lab: data }, { status: 201 });
  }

  const parsed = labSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid lab logo details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db
    .from('storefront_lab_logos')
    .insert({
      name: parsed.data.name,
      image_url: parsed.data.image_url,
      sort_order: parsed.data.sort_order ?? 0,
      is_active: parsed.data.is_active ?? true,
    })
    .select('id, name, image_url, sort_order, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create lab logo' }, { status: 500 });
  return NextResponse.json({ lab: data }, { status: 201 });
}
