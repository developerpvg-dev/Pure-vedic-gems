import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Heart,
  User,
  ChevronRight,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import type { CustomerProfile, Order } from '@/lib/types/database';

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export const metadata = {
  title: 'My Account | PureVedicGems',
  description: 'Manage your orders, profile, and saved gemstones.',
};

// ── Quick link cards ─────────────────────────────────────────────────────────

const QUICK_LINKS = [
  {
    href: '/account/orders',
    icon: Package,
    label: 'My Orders',
    desc: 'Track & view order history',
  },
  {
    href: '/account/saved',
    icon: Heart,
    label: 'Saved Gems',
    desc: 'Your wishlist',
  },
  {
    href: '/account/profile',
    icon: User,
    label: 'Profile & DOB',
    desc: 'Edit details & birth info',
  },
  {
    href: '/consultation',
    icon: Star,
    label: 'Book Consultation',
    desc: 'Expert Vedic guidance',
  },
];

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/?auth=login');

  // Fetch profile + recent orders in parallel
  const [profileResult, ordersResult] = await Promise.all([
    supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const profile = profileResult.data as CustomerProfile | null;
  const recentOrders = (ordersResult.data ?? []) as Order[];
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Valued Customer';

  return (
    <div className="space-y-10">
      {/* ── Welcome header ────────────────────────────────────────────────── */}
      <div className="text-center">
        <p
          className="mb-2 text-[11px] font-semibold uppercase tracking-[3px]"
          style={{ color: 'var(--pvg-accent)' }}
        >
          Welcome back
        </p>
        <h1
          className="font-heading text-4xl md:text-5xl"
          style={{ color: 'var(--pvg-primary)' }}
        >
          {firstName}
        </h1>
        {profile?.rashi && (
          <p className="mt-2 text-sm" style={{ color: 'var(--pvg-muted)' }}>
            Rashi: <strong>{profile.rashi}</strong>
          </p>
        )}
        <OrnamentalDivider className="mx-auto mt-6 max-w-xs" />
      </div>

      {/* ── Quick links ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-xl border p-5 transition-all hover:-translate-y-1 hover:shadow-md"
            style={{
              borderColor: 'var(--pvg-border)',
              background: 'var(--pvg-surface)',
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors group-hover:bg-opacity-80"
              style={{ background: 'var(--pvg-gold-light)' }}
            >
              <Icon className="h-5 w-5" style={{ color: 'var(--pvg-accent)' }} />
            </div>
            <div className="flex-1">
              <p
                className="font-semibold"
                style={{ color: 'var(--pvg-primary)' }}
              >
                {label}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--pvg-muted)' }}>
                {desc}
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              style={{ color: 'var(--pvg-accent)' }}
            />
          </Link>
        ))}
      </div>

      {/* ── Recent orders ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-6 md:p-8"
        style={{
          borderColor: 'var(--pvg-border)',
          background: 'var(--pvg-surface)',
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="font-heading text-xl"
            style={{ color: 'var(--pvg-primary)' }}
          >
            Recent Orders
          </h2>
          <Link
            href="/account/orders"
            className="flex items-center gap-1 text-sm font-semibold transition-colors hover:text-[var(--pvg-accent)]"
            style={{ color: 'var(--pvg-accent)' }}
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag
              className="mx-auto mb-4 h-12 w-12"
              style={{ color: 'var(--pvg-muted)', opacity: 0.4 }}
            />
            <p className="font-semibold" style={{ color: 'var(--pvg-primary)' }}>
              No orders yet
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--pvg-muted)' }}>
              Explore our collection and find your perfect gemstone
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
            >
              Browse Gems
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--pvg-border)' }}>
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: 'var(--pvg-primary)' }}
                  >
                    {order.order_number}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--pvg-muted)' }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span
                    className="font-semibold"
                    style={{ color: 'var(--pvg-primary)' }}
                  >
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                  <Link
                    href={`/account/orders`}
                    className="text-xs font-semibold underline underline-offset-2"
                    style={{ color: 'var(--pvg-accent)' }}
                  >
                    Track
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: string }) {
  const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> =
    {
      pending_payment: {
        label: 'Pending',
        bg: '#fef9c3',
        text: '#854d0e',
      },
      confirmed: { label: 'Confirmed', bg: '#dcfce7', text: '#166534' },
      processing: { label: 'Processing', bg: '#dbeafe', text: '#1e40af' },
      shipped: { label: 'Shipped', bg: '#ede9fe', text: '#5b21b6' },
      delivered: { label: 'Delivered', bg: '#dcfce7', text: '#166534' },
      cancelled: { label: 'Cancelled', bg: '#fee2e2', text: '#991b1b' },
    };

  const s = STATUS_MAP[status] ?? {
    label: status,
    bg: 'var(--pvg-bg-alt)',
    text: 'var(--pvg-muted)',
  };

  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}
