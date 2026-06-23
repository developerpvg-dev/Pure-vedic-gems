import Link from 'next/link';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Flame, ChevronRight, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import type { YagyaBooking } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Yagyas | PureVedicGems',
  description: 'View your PureVedicGems yagya bookings, payment status, and service status.',
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', className: 'bg-amber-100 text-amber-700' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  performed: { label: 'Performed', className: 'bg-teal-100 text-teal-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  payment_review: { label: 'Payment Review', className: 'bg-purple-100 text-purple-700' },
};

const PAYMENT_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  authorized: { label: 'Authorized', className: 'bg-blue-100 text-blue-700' },
  captured: { label: 'Paid', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-600' },
  amount_mismatch: { label: 'Review', className: 'bg-purple-100 text-purple-700' },
};

function Badge({ value, map }: { value: string; map: typeof STATUS_MAP }) {
  const item = map[value] ?? { label: value.replace(/_/g, ' '), className: 'bg-gray-100 text-gray-600' };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${item.className}`}>{item.label}</span>;
}

function formatPrice(value: number | null) {
  if (value == null) return 'Rs 0';
  return `Rs ${value.toLocaleString('en-IN')}`;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function AccountYagyasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/shop?auth=login&next=/account/yagyas');

  const { data, error } = await supabase
    .from('yagya_bookings')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  const bookings = (data ?? []) as YagyaBooking[];

  return (
    <div className="pvg-account-stack">
      <AccountPageHeader
        title="My Yagyas"
        subtitle="Track your yagya bookings, Razorpay payment reference, muhurat, and service status."
        action={(
          <Link href="/vedic-yagyas" className="pvg-account-btn">
            <Flame className="h-4 w-4" aria-hidden="true" /> Book a Yagya
          </Link>
        )}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load yagya bookings right now.
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="pvg-account-card pvg-account-empty">
          <Flame className="pvg-account-empty-icon h-12 w-12" aria-hidden="true" />
          <p className="pvg-account-empty-title">No yagya bookings yet</p>
          <p className="pvg-account-empty-copy">Choose a yagya and complete payment to see it here.</p>
          <Link href="/vedic-yagyas" className="pvg-account-card-link mt-5 inline-flex">
            Browse yagyas <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="pvg-account-card pvg-account-card-pad">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="pvg-account-card-title text-lg">
                    {booking.yagya_title_snapshot || 'Vedic Yagya'}
                  </h2>
                  <p className="pvg-account-row-meta">
                    {booking.booking_number} · Booked on {formatDate(booking.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge value={booking.payment_status} map={PAYMENT_MAP} />
                  <Badge value={booking.status} map={STATUS_MAP} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Amount" value={formatPrice(booking.amount_inr)} icon={<CreditCard className="h-4 w-4" />} />
                <Info label="Sankalp For" value={booking.sankalp_name || booking.full_name} />
                <Info label="Preferred Date" value={booking.preferred_date || '-'} />
                <Info label="Completed" value={formatDate(booking.completed_at)} />
              </div>

              {(booking.scheduled_date || booking.muhurat_note || booking.recording_link) && (
                <div className="pvg-account-info-box mt-5 text-sm">
                  <p className="pvg-account-row-title">Yagya Schedule</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Info label="Muhurat Date" value={formatDate(booking.scheduled_date)} />
                    <Info label="Muhurat Note" value={booking.muhurat_note || '-'} />
                    <Info label="Recording" value={booking.recording_link || '-'} />
                  </div>
                </div>
              )}

              <div className="pvg-account-info-box mt-5 grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-[#2c0404]">Razorpay Order:</span>{' '}
                  <span className="text-[#6b5b4e]">{booking.razorpay_order_id || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#2c0404]">Razorpay Payment:</span>{' '}
                  <span className="text-[#6b5b4e]">{booking.razorpay_payment_id || '-'}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <p className="pvg-account-info-label">{icon}{label}</p>
      <p className="pvg-account-info-value">{value}</p>
    </div>
  );
}
