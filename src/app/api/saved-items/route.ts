import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const savedItemSchema = z.object({
  product_id: z.string().uuid(),
});

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  return { supabase, user };
}

export async function GET() {
  const auth = await getUser();
  if ('error' in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from('saved_items')
    .select('product_id')
    .eq('customer_id', auth.user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to load saved items' }, { status: 500 });
  }

  return NextResponse.json({ product_ids: (data ?? []).map((item) => item.product_id) });
}

export async function POST(request: NextRequest) {
  const auth = await getUser();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = savedItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  const { data: product } = await auth.supabase
    .from('products')
    .select('id')
    .eq('id', parsed.data.product_id)
    .eq('is_active', true)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Product is not available' }, { status: 404 });
  }

  const { data: existing } = await auth.supabase
    .from('saved_items')
    .select('id')
    .eq('customer_id', auth.user.id)
    .eq('product_id', parsed.data.product_id)
    .maybeSingle();

  if (!existing) {
    const { error } = await auth.supabase.from('saved_items').insert({
      customer_id: auth.user.id,
      product_id: parsed.data.product_id,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
    }
  }

  return NextResponse.json({ saved: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await getUser();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = savedItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from('saved_items')
    .delete()
    .eq('customer_id', auth.user.id)
    .eq('product_id', parsed.data.product_id);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove saved product' }, { status: 500 });
  }

  return NextResponse.json({ saved: false });
}