import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CartMergeSchema } from '@/lib/validators/cart';
import { mergeCustomerCart } from '@/lib/cart/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as unknown;
  const parsed = CartMergeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid cart payload', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const cart = await mergeCustomerCart(user.id, parsed.data.items, parsed.data.guest_session_id);
    return NextResponse.json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to merge cart';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}