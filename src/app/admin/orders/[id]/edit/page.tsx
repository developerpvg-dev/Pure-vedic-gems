import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { hasAdminPermission } from '@/lib/admin/rbac';
import type { Json } from '@/lib/types/database';
import {
  OfflineOrderPOS,
  type FulfillmentType,
  type LineItem,
  type OfflineOrderEditInitial,
} from '@/components/admin/OfflineOrderPOS';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

const str = (value: unknown) => (typeof value === 'string' ? value : '');

function toAddress(value: unknown): OfflineOrderEditInitial['addr'] {
  const a = (value && typeof value === 'object' ? value : {}) as Row;
  return {
    line1: str(a.line1),
    line2: str(a.line2),
    city: str(a.city),
    state: str(a.state) || 'Rajasthan',
    pincode: str(a.pincode),
    country: str(a.country) || 'India',
    country_code: str(a.country_code) || 'IN',
  };
}

function toLineItem(raw: unknown, index: number): LineItem {
  const it = (raw && typeof raw === 'object' ? raw : {}) as Row;
  const snap = it.configuration_snapshot && typeof it.configuration_snapshot === 'object'
    ? (it.configuration_snapshot as Row)
    : null;
  const quantity = Number(it.quantity ?? 1) || 1;
  const unitPrice = Number(it.unit_price ?? it.price ?? 0) || 0;
  const name = str(it.name) || `Item ${index + 1}`;
  const base = {
    key: `line-${index}-${str(it.product_id) || 'manual'}`,
    name,
    sku: str(it.sku) || undefined,
    tag_number: str(it.tag_number) || null,
    image_url: str(it.image_url) || undefined,
    configuration_summary: str(it.configuration_summary) || undefined,
  };

  if (str(it.product_id)) {
    return {
      ...base,
      product_id: str(it.product_id),
      price: unitPrice,
      quantity,
      category: str(it.category) || undefined,
      configuration_id: str(it.configuration_id) || undefined,
      configuration_snapshot: snap ?? undefined,
    };
  }

  // Manual design lines, or legacy lines whose product no longer exists → keep as a fixed-price line.
  const manual = snap?.source === 'offline_manual_design' && snap.manual_design && typeof snap.manual_design === 'object'
    ? (snap.manual_design as Row)
    : null;
  const total = unitPrice * quantity;
  return {
    ...base,
    name: name.length >= 2 ? name : `Item ${index + 1}`,
    product_id: null,
    price: total,
    quantity: 1,
    category: 'manual_design',
    configuration_snapshot: snap ?? undefined,
    manual_design: {
      description: str(manual?.description),
      item_price: manual ? Number(manual.item_price ?? 0) || 0 : total,
      metal_price: manual ? Number(manual.metal_price ?? 0) || 0 : 0,
      labour_charge: manual ? Number(manual.labour_charge ?? 0) || 0 : 0,
      other_charge: manual ? Number(manual.other_charge ?? 0) || 0 : 0,
    },
  };
}

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  const supabase = createAdminClient();
  const { data: viewer } = user
    ? await supabase.from('team_members').select('role, permissions').eq('id', user.id).maybeSingle()
    : { data: null };
  if (!hasAdminPermission(viewer?.role, 'orders.edit', (viewer?.permissions ?? null) as Json)) notFound();

  const { data } = await asUntypedSupabase(supabase).from('orders').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const o = data as Row;
  if (['cancelled', 'refunded'].includes(str(o.status))) notFound();

  let profile: Row | null = null;
  if (o.customer_id && (!o.guest_phone || !o.guest_email)) {
    const { data: p } = await supabase
      .from('customer_profiles')
      .select('full_name, phone, email')
      .eq('id', String(o.customer_id))
      .maybeSingle();
    profile = (p as Row | null) ?? null;
  }

  const isOffline = o.order_source === 'offline';
  const fulfillmentType: FulfillmentType = isOffline
    ? ((['in_store', 'pickup', 'delivery'] as const).find((t) => t === o.fulfillment_type) ?? 'in_store')
    : 'delivery';
  const total = Number(o.total ?? 0);
  const storedPaid = Number(o.amount_paid ?? 0);

  const editOrder: OfflineOrderEditInitial = {
    orderId: id,
    orderNumber: str(o.order_number),
    previousTotal: total,
    amountPaid: storedPaid > 0 ? storedPaid : o.payment_status === 'captured' ? total : 0,
    customerId: str(o.customer_id) || null,
    fullName: str(o.guest_name) || str(profile?.full_name),
    phone: str(o.guest_phone) || str(profile?.phone),
    email: str(o.guest_email) || str(profile?.email),
    gstin: str(o.buyer_gstin),
    addr: toAddress(isOffline ? o.billing_address ?? o.shipping_address : o.shipping_address ?? o.billing_address),
    items: (Array.isArray(o.items) ? o.items : []).map(toLineItem),
    fulfillmentType,
    shippingMethod: fulfillmentType === 'delivery' ? str(o.shipping_method) : '',
    couponCode: str(o.coupon_code),
    manualDiscount: Number(o.manual_discount ?? 0) > 0 ? String(o.manual_discount) : '',
    notes: str(o.special_instructions),
    commissions: (Array.isArray(o.commissions) ? (o.commissions as Row[]) : []).map((c) => ({
      source: c.source === 'astrologer' ? 'astrologer' : 'salesperson',
      name: str(c.name),
      amount: String(c.amount ?? ''),
    })),
  };

  return <OfflineOrderPOS editOrder={editOrder} />;
}
