import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
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
  const { data: order, error } = await admin
    .from('orders')
    .select('id, order_number, customer_id, guest_email, guest_phone, guest_access_token, status, tracking_number, tracking_url, estimated_delivery, created_at')
    .eq('order_number', orderNumber)
    .single();

  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

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
    return NextResponse.json({ error: 'Tracking access could not be verified' }, { status: 403 });
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
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      estimated_delivery: order.estimated_delivery,
      created_at: order.created_at,
    },
    events: events ?? [],
  });
}