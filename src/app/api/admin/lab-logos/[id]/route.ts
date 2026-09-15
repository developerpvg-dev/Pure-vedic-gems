import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  image_url: z
    .string()
    .trim()
    .max(1000)
    .refine((value) => value.startsWith('/') || z.string().url().safeParse(value).success)
    .optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid lab logo details' }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db
    .from('storefront_lab_logos')
    .update(parsed.data)
    .eq('id', id)
    .select('id, name, image_url, sort_order, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update lab logo' }, { status: 500 });
  return NextResponse.json({ lab: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const db = asUntypedSupabase(createAdminClient());

  // Soft-deactivate so product FKs stay valid; clear assignment if hard-deleting
  const { error } = await db
    .from('storefront_lab_logos')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to deactivate lab logo' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
