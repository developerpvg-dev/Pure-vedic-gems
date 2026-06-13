import { NextRequest, NextResponse } from 'next/server';
import { CartEventSchema } from '@/lib/validators/cart';
import { logCartEvent } from '@/lib/cart/server';
import { rateLimit } from '@/lib/utils/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`cart-event:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many cart events' }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as unknown;
  const parsed = CartEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid cart event' }, { status: 400 });
  }

  // This is an untrusted, public analytics endpoint. It records the event for
  // funnel analytics but must never raise admin/sales notifications or
  // high-value alerts — those are driven only by server-verified cart
  // mutations where the value is computed from the database.
  await logCartEvent({
    guestSessionId: parsed.data.guest_session_id,
    eventType: parsed.data.event_type,
    productId: parsed.data.product_id,
    quantity: parsed.data.quantity,
    value: parsed.data.value,
    metadata: parsed.data.metadata,
    allowNotifications: false,
  });

  return NextResponse.json({ success: true });
}