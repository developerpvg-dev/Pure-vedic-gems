import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CartUpdateSchema } from '@/lib/validators/cart';
import { removeCustomerCartItem, updateCustomerCartItem } from '@/lib/cart/server';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  return { user };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { itemId } = await params;
  const body = await request.json().catch(() => null) as unknown;
  const parsed = CartUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'quantity is required' }, { status: 400 });
  }

  try {
    const cart = await updateCustomerCartItem(auth.user.id, decodeURIComponent(itemId), parsed.data.quantity);
    return NextResponse.json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update cart item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { itemId } = await params;
  try {
    const cart = await removeCustomerCartItem(auth.user.id, decodeURIComponent(itemId));
    return NextResponse.json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove cart item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
