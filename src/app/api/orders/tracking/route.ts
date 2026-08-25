import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';
import { enrichOrderItemsWithImages, parseOrderItems } from '@/lib/customer/orders';
import { isCustomerCancellable } from '@/lib/constants/order-status';
import {
  parseBankTransferProof,
  publicBankTransferSummary,
} from '@/lib/orders/bank-transfer-proof';
import { normalizeHttpsUrlList, parseComplianceFlags } from '@/lib/orders/returns';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generic, identical response for "not found" and "access denied" so that an
// attacker cannot enumerate valid order numbers (a distinct 404 vs 403 would
// reveal whether an order number exists).
const TRACKING_DENIED = {
  error: 'Tracking access could not be verified. Check your order number and the email or phone used at checkout.',
};

const ORDER_SELECT = [
  'id',
  'order_number',
  'customer_id',
  'guest_email',
  'guest_phone',
  'guest_access_token',
  'status',
  'payment_status',
  'payment_method',
  'payment_review_reason',
  'compliance_flags',
  'created_at',
  'total',
  'subtotal',
  'jewelry_charges',
  'metal_charges',
  'certification_charges',
  'energization_charges',
  'shipping_cost',
  'discount',
  'coupon_code',
  'coupon_discount',
  'reward_discount',
  'reward_points_redeemed',
  'gst_amount',
  'tax_breakdown',
  'shipping_method',
  'shipping_address',
  'special_instructions',
  'include_energization',
  'energization_type',
  'record_ceremony',
  'assigned_designer_id',
  'design_completed_at',
  'tracking_number',
  'tracking_url',
  'carrier',
  'product_video_url',
  'puja_video_url',
  'estimated_delivery',
  'items',
].join(', ');

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`track:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many tracking requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null) as {
    order_number?: string;
    email?: string;
    phone?: string;
    contact?: string;
    token?: string;
  } | null;
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
    .select(ORDER_SELECT)
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
    payment_status: string | null;
    payment_method: string | null;
    payment_review_reason: string | null;
    compliance_flags: unknown;
    created_at: string;
    total: number;
    subtotal: number;
    jewelry_charges: number | null;
    metal_charges: number | null;
    certification_charges: number | null;
    energization_charges: number | null;
    shipping_cost: number | null;
    discount: number | null;
    coupon_code: string | null;
    coupon_discount: number | null;
    reward_discount: number | null;
    reward_points_redeemed: number | null;
    gst_amount: number | null;
    tax_breakdown: unknown;
    shipping_method: string | null;
    shipping_address: Record<string, string> | null;
    special_instructions: string | null;
    include_energization: boolean | null;
    energization_type: string | null;
    record_ceremony: boolean | null;
    assigned_designer_id: string | null;
    design_completed_at: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    carrier: string | null;
    product_video_url: string | null;
    puja_video_url: string | null;
    estimated_delivery: string | null;
    items: unknown;
  };

  const order = orderRaw as TrackingOrderRow | null;

  if (error || !order) {
    if (error) console.error('[orders/tracking] order lookup failed:', error.message ?? error);
    return NextResponse.json(TRACKING_DENIED, { status: 403 });
  }

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
  const accountMatches = Boolean(userId && order.customer_id === userId);

  if (!emailMatches && !phoneMatches && !tokenMatches && !accountMatches) {
    return NextResponse.json(TRACKING_DENIED, { status: 403 });
  }

  const { data: events } = await db
    .from('order_tracking_events')
    .select('status, carrier, tracking_number, tracking_url, event_time, location, note')
    .eq('order_id', order.id)
    .eq('is_customer_visible', true)
    .order('event_time', { ascending: false });

  const items = await enrichOrderItemsWithImages(parseOrderItems(order.items as never), admin);
  const mediaFlags = parseComplianceFlags(order.compliance_flags);

  return NextResponse.json({
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      payment_review_reason: order.payment_review_reason,
      bank_transfer: publicBankTransferSummary(parseBankTransferProof(order.compliance_flags)),
      created_at: order.created_at,
      total: Number(order.total ?? 0),
      subtotal: Number(order.subtotal ?? 0),
      jewelry_charges: Number(order.jewelry_charges ?? 0),
      metal_charges: Number(order.metal_charges ?? 0),
      certification_charges: Number(order.certification_charges ?? 0),
      energization_charges: Number(order.energization_charges ?? 0),
      shipping_cost: Number(order.shipping_cost ?? 0),
      discount: Number(order.discount ?? 0),
      coupon_code: order.coupon_code,
      coupon_discount: Number(order.coupon_discount ?? 0),
      reward_discount: Number(order.reward_discount ?? 0),
      reward_points_redeemed: Number(order.reward_points_redeemed ?? 0),
      gst_amount: Number(order.gst_amount ?? 0),
      tax_breakdown: order.tax_breakdown ?? null,
      shipping_method: order.shipping_method,
      shipping_address: order.shipping_address,
      special_instructions: order.special_instructions,
      include_energization: Boolean(order.include_energization),
      energization_type: order.energization_type,
      record_ceremony: Boolean(order.record_ceremony),
      assigned_designer_id: order.assigned_designer_id,
      design_completed_at: order.design_completed_at,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      carrier: order.carrier,
      product_video_url: order.product_video_url,
      product_video_urls: normalizeHttpsUrlList(mediaFlags.product_video_urls),
      product_image_urls: normalizeHttpsUrlList(mediaFlags.product_image_urls),
      packing_image_urls: normalizeHttpsUrlList(mediaFlags.packing_image_urls),
      puja_video_url: order.puja_video_url,
      energization_image_urls: normalizeHttpsUrlList(mediaFlags.energization_image_urls),
      compliance_flags: order.compliance_flags,
      estimated_delivery: order.estimated_delivery,
      items,
      can_cancel:
        accountMatches && isCustomerCancellable(order.status, order.created_at),
    },
    events: events ?? [],
  });
}
