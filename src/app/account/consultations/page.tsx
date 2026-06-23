import Link from 'next/link';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { CalendarClock, ChevronRight, CreditCard, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import type { Consultation } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Consultations | PureVedicGems',
  description: 'View your PureVedicGems consultation bookings, payment status, and service status.',
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'bg-yellow-100 text-yellow-800' },
  pending: { label: 'Pending', className: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmed', className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  payment_review: { label: 'Payment Review', className: 'bg-purple-100 text-purple-700' },
};

const PAYMENT_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  created: { label: 'Created', className: 'bg-blue-100 text-blue-700' },
  captured: { label: 'Paid', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
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

export default async function AccountConsultationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/shop?auth=login&next=/account/consultations');

  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  const consultations = (data ?? []) as Consultation[];

  return (
    <div className="pvg-account-stack">
      <AccountPageHeader
        title="My Consultations"
        subtitle="Track your paid consultation bookings, Razorpay payment reference, and service status."
        action={(
          <Link href="/consultation" className="pvg-account-btn">
            <CalendarClock className="h-4 w-4" aria-hidden="true" /> Book Consultation
          </Link>
        )}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load consultations right now.
        </div>
      )}

      {consultations.length === 0 ? (
        <div className="pvg-account-card pvg-account-empty">
          <FileText className="pvg-account-empty-icon h-12 w-12" aria-hidden="true" />
          <p className="pvg-account-empty-title">No consultation bookings yet</p>
          <p className="pvg-account-empty-copy">Choose a consultation plan and complete payment to see it here.</p>
          <Link href="/consultation" className="pvg-account-card-link mt-5 inline-flex">
            View plans <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <article key={consultation.id} className="pvg-account-card pvg-account-card-pad">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="pvg-account-card-title text-lg">
                    {consultation.plan_title_snapshot || 'Vedic Consultation'}
                  </h2>
                  <p className="pvg-account-row-meta">
                    Booked on {formatDate(consultation.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge value={consultation.payment_status} map={PAYMENT_MAP} />
                  <Badge value={consultation.status} map={STATUS_MAP} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Amount" value={formatPrice(consultation.amount_inr)} icon={<CreditCard className="h-4 w-4" />} />
                <Info label="Preferred Date" value={consultation.preferred_date || '-'} />
                <Info label="Preferred Time" value={consultation.preferred_time || '-'} />
                <Info label="Completed" value={formatDate(consultation.completed_at)} />
              </div>

              {(consultation.scheduled_date || consultation.scheduled_time || consultation.meeting_link || consultation.admin_schedule_notes) && (
                <div className="pvg-account-info-box mt-5 text-sm">
                  <p className="pvg-account-row-title">Scheduled Consultation</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="Date" value={consultation.scheduled_date || '-'} />
                    <Info label="Time" value={consultation.scheduled_time?.slice(0, 5) || '-'} />
                    <Info label="Mode" value={consultation.scheduled_mode?.replace('_', ' ') || '-'} />
                    <Info label="Link / Venue" value={consultation.meeting_link || '-'} />
                  </div>
                  {consultation.admin_schedule_notes && (
                    <p className="mt-3 text-xs leading-6" style={{ color: 'var(--pvg-muted)' }}>{consultation.admin_schedule_notes}</p>
                  )}
                </div>
              )}

              <div className="pvg-account-info-box mt-5 grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-[#2c0404]">Razorpay Order:</span>{' '}
                  <span className="text-[#6b5b4e]">{consultation.razorpay_order_id || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#2c0404]">Razorpay Payment:</span>{' '}
                  <span className="text-[#6b5b4e]">{consultation.razorpay_payment_id || '-'}</span>
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