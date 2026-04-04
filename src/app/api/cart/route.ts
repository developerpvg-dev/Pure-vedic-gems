import { NextRequest, NextResponse } from 'next/server';

// Cart is managed client-side via localStorage.
// These API routes handle server-side cart sync for authenticated users.
// For now, they return structured responses so the client can merge on login.

export async function GET(_request: NextRequest) {
  // TODO: fetch cart from Supabase for authenticated user
  return NextResponse.json({ items: [], total: 0, item_count: 0 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  // TODO: persist cart item to Supabase server-side cart
  return NextResponse.json({ success: true, item: body }, { status: 201 });
}
