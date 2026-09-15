import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { revalidateProductSurfaces } from '@/lib/shop/revalidate';

const assignSchema = z.object({
  product_id: z.string().uuid(),
  lab_logo_id: z.string().uuid().nullable(),
});

/** Assign / clear which storefront lab logo a product shows on cards. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const parsed = assignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid assignment' }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());

  if (parsed.data.lab_logo_id) {
    const { data: lab } = await db
      .from<{ id: string; is_active: boolean }>('storefront_lab_logos')
      .select('id, is_active')
      .eq('id', parsed.data.lab_logo_id)
      .maybeSingle();
    if (!lab || lab.is_active === false) {
      return NextResponse.json({ error: 'Lab logo not found or inactive' }, { status: 404 });
    }
  }

  const { data, error } = await db
    .from<{
      id: string;
      sku: string | null;
      name: string;
      lab_logo_id: string | null;
      category: string | null;
      sub_category: string | null;
      slug: string;
    }>('products')
    .update({ lab_logo_id: parsed.data.lab_logo_id })
    .eq('id', parsed.data.product_id)
    .select('id, sku, name, lab_logo_id, category, sub_category, slug')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to assign lab logo' }, { status: 500 });

  revalidateProductSurfaces({
    slug: data.slug,
    category: data.category,
    sub_category: data.sub_category,
  });

  return NextResponse.json({ product: data });
}
