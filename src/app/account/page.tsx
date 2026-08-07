import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Heart,
  User,
  ChevronRight,
  Star,
  ShoppingBag,
  MapPin,
  Bell,
  Shield,
  MessageSquare,
  CalendarClock,
  Flame,
  Gift,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import { formatChargedMoney, formatOrderMoney, resolveOrderChargeContext } from '@/lib/currency/format-charged';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import type { Consultation, CustomerProfile, Order } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Account | PureVedicGems',
  description: 'Manage your orders, profile, and saved gemstones.',
};

const QUICK_LINKS = [
  { href: '/account/orders', icon: Package, label: 'My Orders', desc: 'Track & view order history' },
  { href: '/account/rewards', icon: Gift, label: 'Reward Points', desc: 'Balance and ledger' },
  { href: '/account/saved', icon: Heart, label: 'Saved Gems', desc: 'Your wishlist' },
  { href: '/account/profile', icon: User, label: 'Profile & DOB', desc: 'Edit details & birth info' },
  { href: '/account/addresses', icon: MapPin, label: 'Address Book', desc: 'Shipping and GST details' },
  { href: '/account/reviews', icon: MessageSquare, label: 'My Reviews', desc: 'Verified purchase reviews' },
  { href: '/account/preferences', icon: Bell, label: 'Preferences', desc: 'Consent and notifications' },
  { href: '/account/consultations', icon: CalendarClock, label: 'My Consultations', desc: 'Bookings & payment status' },
  { href: '/account/yagyas', icon: Flame, label: 'My Yagyas', desc: 'Bookings & service status' },
  { href: '/consultation', icon: Star, label: 'Book Consultation', desc: 'Expert Vedic guidance' },
  { href: '/track-order', icon: Shield, label: 'Track Guest Order', desc: 'Secure email or phone lookup' },
];

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/shop?auth=login&next=/account');

  const [profileResult, ordersResult, consultationsResult] = await Promise.all([
    supabase.from('customer_profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('consultations').select('*').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(3),
  ]);

  const profile = profileResult.data as CustomerProfile | null;
  const recentOrders = (ordersResult.data ?? []) as Order[];
  const recentConsultations = (consultationsResult.data ?? []) as Consultation[];
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Valued Customer';

  const orderIds = recentOrders.map((o) => o.id);
  const { data: recentPaymentRows } =
    orderIds.length > 0
      ? await asUntypedSupabase(supabase)
          .from('order_payments')
          .select('order_id, amount, reference')
          .in('order_id', orderIds)
          .eq('status', 'paid')
      : { data: [] as Array<{ order_id: string; amount: number; reference: string | null }> };

  const paymentsByOrder = new Map<string, Array<{ amount?: number | null; reference?: string | null }>>();
  for (const row of recentPaymentRows ?? []) {
    const orderId = String((row as { order_id?: string }).order_id ?? '');
    if (!orderId) continue;
    const list = paymentsByOrder.get(orderId) ?? [];
    list.push(row as { amount?: number | null; reference?: string | null });
    paymentsByOrder.set(orderId, list);
  }

  return (
    <div className="pvg-account-stack">
      <AccountPageHeader
        centered
        eyebrow="Welcome back"
        title={firstName}
        subtitle={profile?.rashi ? `Rashi: ${profile.rashi}` : 'Manage orders, saved gems, consultations, and account details in one place.'}
      />

      <div className="pvg-account-quick-grid">
        {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className="pvg-account-quick-link">
            <div className="pvg-account-quick-icon">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="pvg-account-quick-label">{label}</p>
              <p className="pvg-account-quick-desc">{desc}</p>
            </div>
            <ChevronRight className="pvg-account-quick-chevron h-4 w-4" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <section className="pvg-account-card pvg-account-card-pad" aria-labelledby="recent-consultations-heading">
        <div className="pvg-account-card-head">
          <h2 className="pvg-account-card-title" id="recent-consultations-heading">
            Consultation Bookings
          </h2>
          <Link href="/account/consultations" className="pvg-account-card-link">
            View all <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {recentConsultations.length === 0 ? (
          <div className="pvg-account-empty">
            <CalendarClock className="pvg-account-empty-icon h-11 w-11" aria-hidden="true" />
            <p className="pvg-account-empty-title">No consultations yet</p>
            <Link href="/consultation" className="pvg-account-card-link mt-3 inline-flex">
              Book a paid consultation <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="pvg-account-divider">
            {recentConsultations.map((consultation) => (
              <div key={consultation.id} className="pvg-account-row">
                <div>
                  <p className="pvg-account-row-title">{consultation.plan_title_snapshot || 'Vedic Consultation'}</p>
                  <p className="pvg-account-row-meta">
                    {new Date(consultation.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {consultation.razorpay_payment_id || consultation.razorpay_order_id || 'Payment pending'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <ConsultationStatusBadge status={consultation.payment_status} kind="payment" />
                  <ConsultationStatusBadge status={consultation.status} kind="booking" />
                  <span className="text-sm font-bold text-[#2c0404]">
                    {formatChargedMoney(consultation)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pvg-account-card pvg-account-card-pad" aria-labelledby="recent-orders-heading">
        <div className="pvg-account-card-head">
          <h2 className="pvg-account-card-title" id="recent-orders-heading">
            Recent Orders
          </h2>
          <Link href="/account/orders" className="pvg-account-card-link">
            View all <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="pvg-account-empty">
            <ShoppingBag className="pvg-account-empty-icon h-12 w-12" aria-hidden="true" />
            <p className="pvg-account-empty-title">No orders yet</p>
            <p className="pvg-account-empty-copy">Explore our collection and find your perfect gemstone.</p>
            <Link href="/shop" className="pvg-account-btn mt-5">
              Browse Gems
            </Link>
          </div>
        ) : (
          <div className="pvg-account-divider">
            {recentOrders.map((order) => {
              const chargeContext = resolveOrderChargeContext({
                complianceFlags: (order as { compliance_flags?: unknown }).compliance_flags,
                payments: paymentsByOrder.get(order.id) ?? [],
              });
              return (
              <div key={order.id} className="pvg-account-row">
                <div>
                  <p className="pvg-account-row-title">{order.order_number}</p>
                  <p className="pvg-account-row-meta">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm font-bold text-[#2c0404]">
                    {formatOrderMoney(Number(order.total ?? 0), chargeContext)}
                  </span>
                  <Link href="/account/orders" className="pvg-account-card-link text-xs">
                    Track
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ConsultationStatusBadge({ status, kind }: { status: string; kind: 'payment' | 'booking' }) {
  const PAYMENT_MAP: Record<string, { label: string; bg: string; text: string }> = {
    pending: { label: 'Payment Pending', bg: '#fef9c3', text: '#854d0e' },
    created: { label: 'Payment Created', bg: '#dbeafe', text: '#1e40af' },
    captured: { label: 'Paid', bg: '#dcfce7', text: '#166534' },
    failed: { label: 'Payment Failed', bg: '#fee2e2', text: '#991b1b' },
    amount_mismatch: { label: 'Review', bg: '#ede9fe', text: '#5b21b6' },
  };

  const BOOKING_MAP: Record<string, { label: string; bg: string; text: string }> = {
    pending_payment: { label: 'Pending Payment', bg: '#fef9c3', text: '#854d0e' },
    pending: { label: 'Pending', bg: '#dbeafe', text: '#1e40af' },
    confirmed: { label: 'Confirmed', bg: '#fef3c7', text: '#92400e' },
    completed: { label: 'Completed', bg: '#dcfce7', text: '#166534' },
    cancelled: { label: 'Cancelled', bg: '#fee2e2', text: '#991b1b' },
    payment_review: { label: 'Payment Review', bg: '#ede9fe', text: '#5b21b6' },
  };

  const selectedMap = kind === 'payment' ? PAYMENT_MAP : BOOKING_MAP;
  const s = selectedMap[status] ?? { label: status.replace(/_/g, ' '), bg: '#faf8f4', text: '#6b5b4e' };

  return (
    <span className="pvg-account-badge" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
    pending_payment: { label: 'Pending', bg: '#fef9c3', text: '#854d0e' },
    confirmed: { label: 'Confirmed', bg: '#dcfce7', text: '#166534' },
    processing: { label: 'Processing', bg: '#dbeafe', text: '#1e40af' },
    shipped: { label: 'Shipped', bg: '#ede9fe', text: '#5b21b6' },
    delivered: { label: 'Delivered', bg: '#dcfce7', text: '#166534' },
    cancelled: { label: 'Cancelled', bg: '#fee2e2', text: '#991b1b' },
  };

  const s = STATUS_MAP[status] ?? { label: status, bg: '#faf8f4', text: '#6b5b4e' };

  return (
    <span className="pvg-account-badge" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}
