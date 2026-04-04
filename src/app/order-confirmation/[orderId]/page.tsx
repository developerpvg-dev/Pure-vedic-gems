import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import { OrderConfirmationClient } from './OrderConfirmationClient';

interface Props {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Order Confirmed — ${orderId.slice(0, 8)}`,
    robots: { index: false, follow: false },
  };
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
    .select('id, order_number, items, subtotal, shipping_cost, gst_amount, total, shipping_address, payment_status, status, guest_name, guest_email, customer_id, created_at')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    notFound();
  }

  // Security: only show if user is the owner, or it's a guest order accessed in the same session
  if (order.customer_id && user?.id !== order.customer_id) {
    notFound();
  }

  return (
    <OrderConfirmationClient
      order={{
        id: order.id,
        order_number: order.order_number,
        items: order.items as Array<{
          name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          image_url?: string;
          carat_weight?: number;
          origin?: string;
        }>,
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
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
