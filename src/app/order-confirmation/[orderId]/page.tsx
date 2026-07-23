import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import { OrderConfirmationClient } from './OrderConfirmationClient';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Order Status - ${orderId.slice(0, 8)}`,
    robots: { index: false, follow: false },
  };
}

function hashGuestToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  // Constant-time comparison of two hex digests. Falls back to false when the
  // lengths differ (timingSafeEqual would throw).
  if (a.length !== b.length || a.length === 0) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;

  // Validate UUID format to prevent injection
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(orderId)) {
    notFound();
  }

  const supabase = await createClient();
  const adminDb = createAdminClient();

  // Try to identify the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch order using admin client to bypass RLS
  const { data: order, error } = await adminDb
    .from('orders')
    .select(
      'id, order_number, items, subtotal, jewelry_charges, metal_charges, certification_charges, energization_charges, shipping_cost, discount, coupon_discount, coupon_code, reward_discount, reward_points_redeemed, gst_amount, total, shipping_address, payment_status, payment_method, payment_review_reason, compliance_flags, status, guest_name, guest_email, customer_id, guest_access_token, created_at',
    )
    .eq('id', orderId)
    .single();

  if (error || !order) {
    notFound();
  }

  // Security: only show if user is the owner, or it's a guest order accessed in the same session
  if (order.customer_id && user?.id !== order.customer_id) {
    notFound();
  }

  if (!order.customer_id) {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get('pvg_guest_order_token')?.value ?? '';
    const [cookieOrderId, guestToken] = cookieValue.split('.');
    const expectedHash = guestToken ? hashGuestToken(guestToken) : null;

    if (
      !order.guest_access_token ||
      cookieOrderId !== order.id ||
      !expectedHash ||
      !safeEqualHex(expectedHash, order.guest_access_token)
    ) {
      notFound();
    }
  }

  return (
    <OrderConfirmationClient
      order={{
        id: order.id,
        order_number: order.order_number,
        items: ((order.items as Array<{
          name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          image_url?: string;
          carat_weight?: number;
          origin?: string;
          configuration_summary?: string;
          configuration_snapshot?: unknown;
          delivery_eta_label?: string;
        }>) ?? []).map((item) => ({
          ...item,
          name: formatProductDisplayName(item.name),
          configuration_summary: item.configuration_summary
            ? formatProductDisplayName(item.configuration_summary)
            : item.configuration_summary,
        })),
        subtotal: order.subtotal,
        jewelry_charges: order.jewelry_charges ?? 0,
        metal_charges: order.metal_charges ?? 0,
        certification_charges: order.certification_charges ?? 0,
        energization_charges: order.energization_charges ?? 0,
        shipping_cost: order.shipping_cost,
        discount: order.discount ?? 0,
        coupon_discount: order.coupon_discount ?? 0,
        coupon_code: order.coupon_code ?? null,
        reward_discount: order.reward_discount ?? 0,
        reward_points_redeemed: order.reward_points_redeemed ?? 0,
        gst_amount: order.gst_amount,
        total: order.total,
        shipping_address: order.shipping_address as {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          pincode: string;
          country: string;
        },
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        payment_review_reason:
          (order as { payment_review_reason?: string | null }).payment_review_reason ?? null,
        compliance_flags: (order as { compliance_flags?: unknown }).compliance_flags ?? null,
        status: order.status,
        guest_name: order.guest_name,
        guest_email: order.guest_email,
        customer_id: order.customer_id,
        created_at: order.created_at,
      }}
      isLoggedIn={!!user}
    />
  );
}
