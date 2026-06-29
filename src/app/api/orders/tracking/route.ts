import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generic, identical response for "not found" and "access denied" so that an
// attacker cannot enumerate valid order numbers (a distinct 404 vs 403 would
// reveal whether an order number exists).
const TRACKING_DENIED = {
  error: 'Tracking access could not be verified. Check your order number and the email or phone used at checkout.',
};

export async function POST(request: NextRequest) {
  // ── Rate limiting: 10 tracking lookups per minute per IP ──────────────
  // Prevents brute-forcing the email/phone verification field against a known
  // order number.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`track:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many tracking requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null) as { order_number?: string; email?: string; phone?: string; contact?: string; token?: string } | null;
  const orderNumber = body?.order_number?.trim();
  if (!orderNumber) return NextResponse.json({ error: 'order_number is required' }, { status: 400 });
  const contact = body?.contact?.trim();

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);
  const { data: orderRaw, error } = await db
    .from('orders')
    .select('id, order_number, customer_id, guest_email, guest_phone, guest_access_token, status, payment_status, assigned_designer_id, design_completed_at, tracking_number, tracking_url, carrier, product_video_url, puja_video_url, estimated_delivery, created_at')
    .eq('order_number', orderNumber)
    .single();

  type TrackingOrderRow = {
    id: string;
    order_number: string;
    customer_id: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    guest_access_token: string | null;
    status: string;
    payment_status?: string | null;
    assigned_designer_id?: string | null;
    design_completed_at?: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    carrier?: string | null;
    product_video_url?: string | null;
    puja_video_url?: string | null;
    estimated_delivery: string | null;
    created_at: string;
  };

  const order = orderRaw as TrackingOrderRow | null;

  // Return the same payload + status for "not found" as for "access denied".
  if (error || !order) return NextResponse.json(TRACKING_DENIED, { status: 403 });

  const normalizedContact = contact?.toLowerCase();
  const normalizedPhoneContact = contact?.replace(/\D/g, '');
  const emailMatches =
    (body?.email && order.guest_email?.toLowerCase() === body.email.trim().toLowerCase()) ||
    (normalizedContact && order.guest_email?.toLowerCase() === normalizedContact);
  const phoneMatches =
    (body?.phone && order.guest_phone?.replace(/\D/g, '') === body.phone.replace(/\D/g, '')) ||
    (normalizedPhoneContact && order.guest_phone?.replace(/\D/g, '') === normalizedPhoneContact);
  const rawToken = body?.token?.includes('.') ? body.token.split('.').pop() : body?.token;
  const tokenMatches = rawToken && order.guest_access_token && hashToken(rawToken) === order.guest_access_token;
  const accountMatches = userId && order.customer_id === userId;

  if (!emailMatches && !phoneMatches && !tokenMatches && !accountMatches) {
    return NextResponse.json(TRACKING_DENIED, { status: 403 });
  }

  const { data: events } = await db
    .from('order_tracking_events')
    .select('status, carrier, tracking_number, tracking_url, event_time, location, note')
    .eq('order_id', order.id)
    .eq('is_customer_visible', true)
    .order('event_time', { ascending: false });

  return NextResponse.json({
    order: {
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status ?? null,
      assigned_designer_id: order.assigned_designer_id ?? null,
      design_completed_at: order.design_completed_at ?? null,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      carrier: order.carrier ?? null,
      product_video_url: order.product_video_url ?? null,
      puja_video_url: order.puja_video_url ?? null,
      estimated_delivery: order.estimated_delivery,
      created_at: order.created_at,
    },
    events: events ?? [],
  });
}