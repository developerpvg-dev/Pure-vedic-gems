import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isReviewEligibleStatus, parseOrderItems } from '@/lib/customer/orders';

const reviewCreateSchema = z.object({
  product_id: z.string().uuid(),
  order_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  review_text: z.string().trim().min(10).max(1200),
  customer_location: z.string().trim().max(80).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const parsed = reviewCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { data: product } = await supabase
    .from('products')
    .select('id, name, allow_reviews')
    .eq('id', parsed.data.product_id)
    .eq('is_active', true)
    .single();

  const productRow = product as { id: string; name: string; allow_reviews?: boolean } | null;
  if (!productRow || productRow.allow_reviews === false) {
    return NextResponse.json({ error: 'Reviews are not enabled for this product' }, { status: 404 });
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_id, status, items')
    .eq('id', parsed.data.order_id)
    .eq('customer_id', user.id)
    .single();

  if (!order || !isReviewEligibleStatus(order.status)) {
    return NextResponse.json({ error: 'Only delivered verified purchases can be reviewed' }, { status: 403 });
  }

  const purchased = parseOrderItems(order.items).some((item) => item.product_id === parsed.data.product_id);
  if (!purchased) {
    return NextResponse.json({ error: 'This product was not part of the selected order' }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('customer_id', user.id)
    .eq('product_id', parsed.data.product_id)
    .eq('order_id', parsed.data.order_id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'Review already submitted for this purchase' }, { status: 409 });

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();
  const typedProfile = profile as { full_name: string | null; email: string | null } | null;
  const customerName = typedProfile?.full_name || user.email?.split('@')[0] || 'Verified Customer';

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      product_id: parsed.data.product_id,
      order_id: parsed.data.order_id,
      customer_id: user.id,
      customer_name: customerName,
      customer_location: parsed.data.customer_location || null,
      rating: parsed.data.rating,
      title: parsed.data.title,
      review_text: parsed.data.review_text,
      images: [],
      is_verified: true,
      is_approved: false,
      is_featured: false,
    })
    .select('id, is_approved')
    .single();

  if (error || !review) return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  return NextResponse.json({ review, status: 'pending_moderation' }, { status: 201 });
}