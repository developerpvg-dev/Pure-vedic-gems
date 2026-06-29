import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import { AccountOrderCard, type AccountOrderCardData } from '@/components/account/AccountOrderCard';
import {
  enrichManyOrderItemLists,
  parseOrderItems,
} from '@/lib/customer/orders';
import type { Order } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Orders | PureVedicGems',
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/shop?auth=login&next=/account/orders');

  const { data: rawOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  const orders = (rawOrders ?? []) as Order[];

  const parsedItemLists = orders.map((order) => parseOrderItems(order.items));
  const enrichedLists = await enrichManyOrderItemLists(parsedItemLists, supabase);

  const orderCards: AccountOrderCardData[] = orders.map((order, index) => {
      const items = enrichedLists[index] ?? [];
      const extras = order as Order & {
        product_video_url?: string | null;
        puja_video_url?: string | null;
        assigned_designer_id?: string | null;
        design_completed_at?: string | null;
        carrier?: string | null;
        payment_status?: string | null;
      };
      const shippingAddress = order.shipping_address as AccountOrderCardData['shipping_address'];

      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: extras.payment_status ?? null,
        created_at: order.created_at,
        total: order.total,
        subtotal: order.subtotal,
        jewelry_charges: order.jewelry_charges ?? 0,
        metal_charges: order.metal_charges ?? 0,
        certification_charges: order.certification_charges ?? 0,
        energization_charges: order.energization_charges ?? 0,
        shipping_cost: order.shipping_cost ?? 0,
        discount: order.discount ?? 0,
        coupon_code: order.coupon_code,
        coupon_discount: order.coupon_discount ?? 0,
        reward_discount: order.reward_discount ?? 0,
        reward_points_redeemed: order.reward_points_redeemed ?? 0,
        gst_amount: order.gst_amount ?? 0,
        shipping_method: order.shipping_method,
        shipping_address: shippingAddress,
        special_instructions: order.special_instructions,
        include_energization: order.include_energization ?? false,
        energization_type: order.energization_type,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        carrier: extras.carrier ?? null,
        estimated_delivery: order.estimated_delivery,
        product_video_url: extras.product_video_url ?? null,
        puja_video_url: extras.puja_video_url ?? null,
        assigned_designer_id: extras.assigned_designer_id ?? null,
        design_completed_at: extras.design_completed_at ?? null,
        items,
      };
  });

  return (
    <div className="pvg-account-stack">
      <AccountPageHeader
        title="My Orders"
        subtitle="Track and view your complete order history."
      />

      {!orderCards.length ? (
        <div className="pvg-account-card pvg-account-empty">
          <Package className="pvg-account-empty-icon h-14 w-14" aria-hidden="true" />
          <h2 className="pvg-account-empty-title">No orders yet</h2>
          <p className="pvg-account-empty-copy">Your order history will appear here once you make a purchase.</p>
          <Link href="/shop" className="pvg-account-btn mt-6">
            Explore Gemstones
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orderCards.map((order) => (
            <AccountOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
