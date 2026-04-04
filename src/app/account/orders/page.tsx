import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import type { Order } from '@/lib/types/database';

export const revalidate = 60;

export const metadata = {
  title: 'My Orders | PureVedicGems',
};

const STATUS_STEPS = [
  'pending_payment',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

function getStatusStep(status: string) {
  return STATUS_STEPS.indexOf(status);
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending_payment: { label: 'Pending Payment', bg: '#fef9c3', text: '#854d0e' },
  confirmed: { label: 'Confirmed', bg: '#dcfce7', text: '#166534' },
  processing: { label: 'Processing', bg: '#dbeafe', text: '#1e40af' },
  shipped: { label: 'Shipped', bg: '#ede9fe', text: '#5b21b6' },
  delivered: { label: 'Delivered', bg: '#dcfce7', text: '#166534' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', text: '#991b1b' },
  refunded: { label: 'Refunded', bg: '#f3f4f6', text: '#374151' },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const adminDb = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/?auth=login');

  const { data: rawOrders } = await adminDb
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });
  const orders = (rawOrders ?? []) as Order[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/account"
          className="mb-4 inline-flex items-center gap-1 text-sm hover:underline"
          style={{ color: 'var(--pvg-muted)' }}
        >
          <ChevronLeft className="h-4 w-4" /> Back to Account
        </Link>
        <h1
          className="font-heading text-3xl md:text-4xl"
          style={{ color: 'var(--pvg-primary)' }}
        >
          My Orders
        </h1>
        <OrnamentalDivider className="mt-4 max-w-[200px]" />
      </div>

      {/* Order list */}
      {!orders || orders.length === 0 ? (
        <div
          className="rounded-2xl border py-20 text-center"
          style={{ borderColor: 'var(--pvg-border)', background: 'var(--pvg-surface)' }}
        >
          <Package
            className="mx-auto mb-4 h-14 w-14"
            style={{ color: 'var(--pvg-muted)', opacity: 0.35 }}
          />
          <h2
            className="font-heading text-xl"
            style={{ color: 'var(--pvg-primary)' }}
          >
            No orders yet
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--pvg-muted)' }}>
            Your order history will appear here once you make a purchase.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-lg px-7 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
          >
            Explore Gemstones
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            const statusInfo =
              STATUS_MAP[order.status] ??
              STATUS_MAP['confirmed'];
            const stepIdx = getStatusStep(order.status);

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border"
                style={{
                  borderColor: 'var(--pvg-border)',
                  background: 'var(--pvg-surface)',
                }}
              >
                {/* Order card header */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                  style={{ background: 'var(--pvg-bg-alt)' }}
                >
                  <div>
                    <p
                      className="font-heading text-lg"
                      style={{ color: 'var(--pvg-primary)' }}
                    >
                      {order.order_number}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--pvg-muted)' }}>
                      Placed on{' '}
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        background: statusInfo.bg,
                        color: statusInfo.text,
                      }}
                    >
                      {statusInfo.label}
                    </span>
                    <span
                      className="text-xl font-bold"
                      style={{ color: 'var(--pvg-primary)' }}
                    >
                      ₹{order.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Order timeline (for active orders) */}
                {stepIdx >= 0 && order.status !== 'cancelled' && (
                  <div className="px-6 py-4">
                    <div className="flex items-center">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className="flex flex-1 items-center">
                          <div className="flex flex-col items-center">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors"
                              style={{
                                background:
                                  i <= stepIdx
                                    ? 'var(--pvg-accent)'
                                    : 'var(--pvg-bg-alt)',
                                color:
                                  i <= stepIdx
                                    ? 'white'
                                    : 'var(--pvg-muted)',
                                border:
                                  i <= stepIdx
                                    ? 'none'
                                    : '2px solid var(--pvg-border)',
                              }}
                            >
                              {i < stepIdx ? '✓' : i + 1}
                            </div>
                            <span
                              className="mt-1 hidden text-[9px] uppercase tracking-wider sm:block"
                              style={{
                                color:
                                  i <= stepIdx
                                    ? 'var(--pvg-primary)'
                                    : 'var(--pvg-muted)',
                                fontWeight: i === stepIdx ? 700 : 400,
                              }}
                            >
                              {step.replace('_', ' ')}
                            </span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div
                              className="h-0.5 flex-1"
                              style={{
                                background:
                                  i < stepIdx
                                    ? 'var(--pvg-accent)'
                                    : 'var(--pvg-border)',
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items list */}
                {items.length > 0 && (
                  <div
                    className="divide-y px-6 pb-4"
                    style={{ borderColor: 'var(--pvg-border)' }}
                  >
                    {(items as Array<{ name?: string; price?: number; quantity?: number }>)
                      .slice(0, 3)
                      .map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: 'var(--pvg-text)' }}
                            >
                              {item.name ?? 'Product'}
                            </p>
                            {item.quantity && item.quantity > 1 && (
                              <p
                                className="text-xs"
                                style={{ color: 'var(--pvg-muted)' }}
                              >
                                Qty: {item.quantity}
                              </p>
                            )}
                          </div>
                          {item.price && (
                            <p
                              className="text-sm font-semibold"
                              style={{ color: 'var(--pvg-primary)' }}
                            >
                              ₹{item.price.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      ))}
                    {items.length > 3 && (
                      <p
                        className="pt-2 text-xs"
                        style={{ color: 'var(--pvg-muted)' }}
                      >
                        +{items.length - 3} more item(s)
                      </p>
                    )}
                  </div>
                )}

                {/* Tracking */}
                {order.tracking_number && (
                  <div
                    className="flex items-center justify-between border-t px-6 py-3"
                    style={{ borderColor: 'var(--pvg-border)' }}
                  >
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--pvg-muted)' }}
                      >
                        Tracking
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--pvg-primary)' }}
                      >
                        {order.tracking_number}
                      </p>
                    </div>
                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5"
                        style={{
                          background: 'var(--pvg-primary)',
                          color: 'var(--pvg-bg)',
                        }}
                      >
                        Track Package
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
