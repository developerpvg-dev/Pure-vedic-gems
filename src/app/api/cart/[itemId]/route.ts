import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.quantity !== 'number') {
    return NextResponse.json({ error: 'quantity is required' }, { status: 400 });
  }
  // TODO: update quantity in Supabase cart for authenticated user
  return NextResponse.json({ success: true, itemId, quantity: body.quantity });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  // TODO: remove item from Supabase cart for authenticated user
  return NextResponse.json({ success: true, itemId });
}
