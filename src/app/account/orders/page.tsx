import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import { AccountOrderCard, type AccountOrderCardData } from '@/components/account/AccountOrderCard';
import type { CustomerPaymentRow } from '@/components/account/OrderBalancePanel';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import {
  enrichManyOrderItemLists,
  parseOrderItems,
} from '@/lib/customer/orders';
import {
  evaluateReturnEligibility,
  getDeliveredAt,
  parseComplianceFlags,
  resolveReturnWindowDays,
} from '@/lib/orders/returns';
import { publicBankTransferSummary, parseBankTransferProof } from '@/lib/orders/bank-transfer-proof';
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

  if (!user) redirect('/gemstones?auth=login&next=/account/orders');

  const { data: rawOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  const orders = (rawOrders ?? []) as Order[];

  const parsedItemLists = orders.map((order) => parseOrderItems(order.items));
  const enrichedLists = await enrichManyOrderItemLists(parsedItemLists, supabase);

  // Advance / balance receipts — RLS scopes these to the signed-in customer.
  const paymentsByOrder = new Map<string, CustomerPaymentRow[]>();
  if (orders.length) {
    const { data: paymentRows } = await asUntypedSupabase(supabase)
      .from('order_payments')
      .select('id, order_id, amount, method, kind, status, reference, paid_at')
      .in('order_id', orders.map((order) => order.id))
      .order('paid_at', { ascending: true });

    for (const row of (paymentRows ?? []) as Array<CustomerPaymentRow & { order_id: string }>) {
      const list = paymentsByOrder.get(row.order_id) ?? [];
      list.push(row);
      paymentsByOrder.set(row.order_id, list);
    }
  }

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('full_name, email, phone')
    .eq('id', user.id)
    .maybeSingle();

  const productIds = new Set<string>();
  for (const items of enrichedLists) {
    for (const item of items) {
      if (item.product_id) productIds.add(item.product_id);
    }
  }

  const productReturnMeta = new Map<
    string,
    { return_eligibility?: string | null; return_window_days?: number | null }
  >();
  if (productIds.size) {
    const { data: products } = await supabase
      .from('products')
      .select('id, return_eligibility, return_window_days')
      .in('id', [...productIds]);
    for (const row of products ?? []) {
      productReturnMeta.set(row.id as string, {
        return_eligibility: (row as { return_eligibility?: string | null }).return_eligibility,
        return_window_days: (row as { return_window_days?: number | null }).return_window_days,
      });
    }
  }

  const orderCards: AccountOrderCardData[] = orders.map((order, index) => {
      const items = enrichedLists[index] ?? [];
      const extras = order as Order & {
        product_video_url?: string | null;
        puja_video_url?: string | null;
        assigned_designer_id?: string | null;
        design_completed_at?: string | null;
        carrier?: string | null;
        delivery_status?: string | null;
        shipped_at?: string | null;
        payment_status?: string | null;
        return_status?: string;
        compliance_flags?: unknown;
      };
      const shippingAddress = order.shipping_address as AccountOrderCardData['shipping_address'];
      const flags = parseComplianceFlags(extras.compliance_flags);
      const itemProducts = items
        .map((item) => (item.product_id ? productReturnMeta.get(item.product_id) : null))
        .filter(Boolean) as Array<{
        return_eligibility?: string | null;
        return_window_days?: number | null;
      }>;
      const { windowDays, allNonReturnable } = resolveReturnWindowDays(itemProducts);
      const eligibility = evaluateReturnEligibility({
        orderStatus: order.status,
        returnStatus: extras.return_status || 'none',
        deliveredAt: getDeliveredAt({
          status: order.status,
          updated_at: order.updated_at,
          compliance_flags: extras.compliance_flags,
        }),
        windowDays,
        allNonReturnable,
      });

      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: extras.payment_status ?? null,
        payment_method: (order as Order & { payment_method?: string | null }).payment_method ?? null,
        payment_review_reason:
          (order as Order & { payment_review_reason?: string | null }).payment_review_reason ?? null,
        bank_transfer: publicBankTransferSummary(parseBankTransferProof(extras.compliance_flags)),
        created_at: order.created_at,
        total: order.total,
        amount_paid: order.amount_paid ?? null,
        amount_due: order.amount_due ?? null,
        balance_due_notified_at: order.balance_due_notified_at ?? null,
        payments: paymentsByOrder.get(order.id) ?? [],
        payer: {
          name: profile?.full_name || order.guest_name || 'Valued Customer',
          email: profile?.email || order.guest_email || user.email || '',
          contact: profile?.phone || order.guest_phone || '',
        },
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
        tax_breakdown: order.tax_breakdown ?? null,
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
        product_video_urls: flags.product_video_urls ?? [],
        product_image_urls: flags.product_image_urls ?? [],
        packing_image_urls: flags.packing_image_urls ?? [],
        puja_video_url: extras.puja_video_url ?? null,
        delivery_status: extras.delivery_status ?? null,
        shipped_at: extras.shipped_at ?? null,
        energization_image_urls: flags.energization_image_urls ?? [],
        compliance_flags: extras.compliance_flags ?? null,
        assigned_designer_id: extras.assigned_designer_id ?? null,
        design_completed_at: extras.design_completed_at ?? null,
        items,
        return_status: extras.return_status || 'none',
        return_eligible: eligibility.eligible,
        return_message: eligibility.reason,
        return_reason: flags.return_reason ?? null,
        receipt_confirmed: Boolean(flags.receipt_confirmed),
        receipt_ok: flags.receipt_confirmed ? Boolean(flags.receipt_ok) : null,
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
          <Link href="/gemstones" className="pvg-account-btn mt-6">
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
