import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CartItemInputSchema } from '@/lib/validators/cart';
import {
  clearCustomerCart,
  getCustomerCart,
  upsertCustomerCartItem,
} from '@/lib/cart/server';

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

export async function GET() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  try {
    const cart = await getCustomerCart(auth.user.id);
    return NextResponse.json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch cart';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null) as unknown;
  const rawItem =
    body && typeof body === 'object' && 'item' in body
      ? (body as { item: unknown }).item
      : body;

  const parsed = CartItemInputSchema.safeParse(rawItem);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const guestSessionId =
    body && typeof body === 'object' && 'guest_session_id' in body
      ? String((body as { guest_session_id?: string }).guest_session_id ?? '')
      : undefined;

  try {
    const cart = await upsertCustomerCartItem(auth.user.id, parsed.data, guestSessionId || undefined);
    return NextResponse.json(cart, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add cart item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  try {
    const cart = await clearCustomerCart(auth.user.id);
    return NextResponse.json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to clear cart';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
