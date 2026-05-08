import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isReorderEligibleStatus, parseOrderItems } from '@/lib/customer/orders';
import type { CartItemInput } from '@/lib/validators/cart';
import type { Product } from '@/lib/types/database';

const reorderSchema = z.object({ order_id: z.string().uuid() });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const parsed = reorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });

  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_id, status, items')
    .eq('id', parsed.data.order_id)
    .eq('customer_id', user.id)
    .single();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!isReorderEligibleStatus(order.status)) {
    return NextResponse.json({ error: 'This order is not eligible for reorder' }, { status: 409 });
  }

  const orderItems = parseOrderItems(order.items);
  const productIds = [...new Set(orderItems.map((item) => item.product_id).filter((id): id is string => Boolean(id)))];
  const { data: products } = productIds.length > 0
    ? await supabase.from('products').select('*').in('id', productIds).eq('is_active', true)
    : { data: [] };
  const productMap = new Map((products as Product[] | null ?? []).map((product) => [product.id, product]));

  const items: CartItemInput[] = [];
  const unavailable: Array<{ product_id: string | null; name: string; reason: string }> = [];

  for (const item of orderItems) {
    const product = item.product_id ? productMap.get(item.product_id) : null;
    if (!product) {
      unavailable.push({ product_id: item.product_id ?? null, name: item.name ?? 'Custom item', reason: 'Product is no longer available in the catalog' });
      continue;
    }
    if (!product.in_stock || ['sold', 'reserved', 'out_of_stock', 'archived'].includes(product.availability_status)) {
      unavailable.push({ product_id: product.id, name: product.name, reason: 'Product is sold, reserved, or unavailable' });
      continue;
    }
    if (item.configuration_id) {
      unavailable.push({ product_id: product.id, name: product.name, reason: 'Configured jewellery should be reviewed before reordering' });
      continue;
    }

    items.push({
      product_id: product.id,
      sku: product.sku,
      tag_number: product.tag_number,
      name: product.name,
      category: product.category,
      image_url: product.thumbnail_url ?? item.image_url ?? '',
      price: product.price,
      quantity: Math.min(Math.max(item.quantity ?? 1, 1), 10),
      carat_weight: product.carat_weight,
      origin: product.origin,
    });
  }

  return NextResponse.json({ items, unavailable });
}