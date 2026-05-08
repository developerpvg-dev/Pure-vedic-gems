import Link from 'next/link';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { CalendarClock, ChevronRight, CreditCard, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[3px]" style={{ color: 'var(--pvg-accent)' }}>
            Account Dashboard
          </p>
          <h1 className="font-heading text-3xl md:text-4xl" style={{ color: 'var(--pvg-primary)' }}>My Consultations</h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--pvg-muted)' }}>
            Track your paid consultation bookings, Razorpay payment reference, and service status.
          </p>
        </div>
        <Link
          href="/consultation"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5"
          style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
        >
          <CalendarClock className="h-4 w-4" /> Book Consultation
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load consultations right now.
        </div>
      )}

      {consultations.length === 0 ? (
        <div className="rounded-2xl border px-6 py-16 text-center" style={{ borderColor: 'var(--pvg-border)', background: 'var(--pvg-surface)' }}>
          <FileText className="mx-auto h-12 w-12 opacity-40" style={{ color: 'var(--pvg-muted)' }} />
          <p className="mt-4 font-semibold" style={{ color: 'var(--pvg-primary)' }}>No consultation bookings yet</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--pvg-muted)' }}>Choose a consultation plan and complete payment to see it here.</p>
          <Link href="/consultation" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--pvg-accent)' }}>
            View plans <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <article key={consultation.id} className="rounded-2xl border p-5 md:p-6" style={{ borderColor: 'var(--pvg-border)', background: 'var(--pvg-surface)' }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl" style={{ color: 'var(--pvg-primary)' }}>
                    {consultation.plan_title_snapshot || 'Vedic Consultation'}
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: 'var(--pvg-muted)' }}>
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

              <div className="mt-5 grid gap-3 rounded-xl border px-4 py-3 text-xs sm:grid-cols-2" style={{ borderColor: 'var(--pvg-border)', background: 'var(--pvg-bg)' }}>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--pvg-primary)' }}>Razorpay Order:</span>{' '}
                  <span style={{ color: 'var(--pvg-muted)' }}>{consultation.razorpay_order_id || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--pvg-primary)' }}>Razorpay Payment:</span>{' '}
                  <span style={{ color: 'var(--pvg-muted)' }}>{consultation.razorpay_payment_id || '-'}</span>
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
      <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pvg-muted)' }}>
        {icon}{label}
      </p>
      <p className="font-semibold" style={{ color: 'var(--pvg-primary)' }}>{value}</p>
    </div>
  );
}