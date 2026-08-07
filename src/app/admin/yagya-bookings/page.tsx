'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CreditCard, Flame, IndianRupee, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { AdminAnalyticsPanel, AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { MetricBars, RevenueTrendChart, fmtInr } from '@/components/admin/AdminCharts';
import { formatChargedMoney } from '@/lib/currency/format-charged';

interface YagyaBooking {
  id: string;
  booking_number: string;
  customer_id: string | null;
  yagya_title_snapshot: string;
  full_name: string;
  email: string;
  phone: string | null;
  sankalp_name: string | null;
  gotra: string | null;
  rashi: string | null;
  nakshatra: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  preferred_date: string | null;
  message: string | null;
  amount_inr: number | string | null;
  amount_paise?: number | string | null;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: string;
  scheduled_date: string | null;
  muhurat_note: string | null;
  recording_link: string | null;
  admin_notes: string | null;
  completed_at: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  'pending_payment',
  'confirmed',
  'scheduled',
  'performed',
  'completed',
  'cancelled',
  'payment_review',
];

const STATUS_STYLE: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-blue-100 text-blue-700',
  performed: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  payment_review: 'bg-purple-100 text-purple-700',
};

const PAYMENT_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  authorized: 'bg-blue-100 text-blue-700',
  captured: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
  amount_mismatch: 'bg-purple-100 text-purple-700',
};

function formatBookingAmount(b: Pick<YagyaBooking, 'amount_inr' | 'amount_paise' | 'currency'>) {
  return formatChargedMoney({
    amount_inr: b.amount_inr == null ? null : Number(b.amount_inr),
    amount_paise: b.amount_paise == null ? null : Number(b.amount_paise),
    currency: b.currency,
  });
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminYagyaBookingsPage() {
  const [bookings, setBookings] = useState<YagyaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<YagyaBooking | null>(null);
  const [analytics, setAnalytics] = useState<{
    summary: { totalBookings: number; capturedPayments: number; pendingPayments: number; capturedRevenue: number; avgBookingValue: number; completedServices: number };
    trend: Array<{ date: string; label: string; orders: number; revenue: number }>;
    statusBreakdown: Array<{ label: string; value: number; meta: number }>;
    paymentBreakdown: Array<{ label: string; value: number; meta: number }>;
  } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [canWriteOrders, setCanWriteOrders] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/session');
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setCanWriteOrders(Boolean(data.canWriteOrders));
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (paymentFilter !== 'all') qs.set('payment_status', paymentFilter);
      if (search.trim()) qs.set('q', search.trim());
      const res = await fetch(`/api/admin/yagya-bookings?${qs.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch {
      toast.error('Failed to load yagya bookings');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setAnalyticsLoading(true);
    fetch('/api/admin/yagya-bookings/analytics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setAnalytics(data); })
      .catch(() => undefined)
      .finally(() => setAnalyticsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Yagya Bookings"
        description="Manage paid yagya bookings, sankalp details, payments, and service status."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total bookings" value={(analytics?.summary.totalBookings ?? bookings.length).toLocaleString('en-IN')} icon={Flame} tone="text-amber-600" bg="bg-amber-50" />
        <AdminStatCard label="Captured revenue" value={fmtInr(analytics?.summary.capturedRevenue ?? 0)} icon={IndianRupee} tone="text-green-600" bg="bg-green-50" subtext={`${analytics?.summary.capturedPayments ?? 0} payments`} />
        <AdminStatCard label="Pending payment" value={(analytics?.summary.pendingPayments ?? bookings.filter((b) => b.payment_status === 'pending').length).toLocaleString('en-IN')} icon={CreditCard} tone="text-yellow-600" bg="bg-yellow-50" />
        <AdminStatCard label="Completed services" value={(analytics?.summary.completedServices ?? 0).toLocaleString('en-IN')} icon={BarChart3} tone="text-teal-600" bg="bg-teal-50" subtext={analytics?.summary.avgBookingValue ? `Avg ${fmtInr(analytics.summary.avgBookingValue)}` : undefined} />
      </div>

      <AdminAnalyticsPanel
        title="Booking analytics"
        subtitle="Last 30 days · revenue & pipeline"
        loading={analyticsLoading}
        open={analyticsOpen}
        onToggle={() => setAnalyticsOpen((v) => !v)}
      >
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-3">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Booking trend</h3>
            {analytics ? <RevenueTrendChart data={analytics.trend} /> : null}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-2">
            <MetricBars embedded title="Payment status" icon={CreditCard} items={analytics?.paymentBreakdown.slice(0, 6) ?? []} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <MetricBars embedded title="Service status" icon={Flame} items={analytics?.statusBreakdown.slice(0, 8) ?? []} />
        </div>
      </AdminAnalyticsPanel>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void load()}
            placeholder="Search name, email, booking #"
            className="w-72 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
        >
          <option value="all">All payments</option>
          {Object.keys(PAYMENT_STYLE).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Apply
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-500">
          No yagya bookings found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Yagya</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Booked</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-amber-50/40">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.booking_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{b.yagya_title_snapshot}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{b.full_name}</p>
                    <p className="text-xs text-gray-400">{b.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatBookingAmount(b)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${PAYMENT_STYLE[b.payment_status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${STATUS_STYLE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(b.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActive(b)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                    >
                      {canWriteOrders ? 'Manage' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <ManageDialog
          booking={active}
          readOnly={!canWriteOrders}
          onClose={() => setActive(null)}
          onSaved={(updated) => {
            setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            setActive(updated);
          }}
        />
      )}
    </div>
  );
}

function ManageDialog({
  booking,
  readOnly = false,
  onClose,
  onSaved,
}: {
  booking: YagyaBooking;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: (updated: YagyaBooking) => void;
}) {
  const [status, setStatus] = useState(booking.status);
  const [scheduledDate, setScheduledDate] = useState(booking.scheduled_date ?? '');
  const [muhuratNote, setMuhuratNote] = useState(booking.muhurat_note ?? '');
  const [recordingLink, setRecordingLink] = useState(booking.recording_link ?? '');
  const [adminNotes, setAdminNotes] = useState(booking.admin_notes ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (readOnly) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/yagya-bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          scheduled_date: scheduledDate,
          muhurat_note: muhuratNote,
          recording_link: recordingLink,
          admin_notes: adminNotes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast.success('Booking updated');
      onSaved(data.booking as YagyaBooking);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">{booking.booking_number}</p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">{booking.yagya_title_snapshot}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <section className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50/60 p-4 text-sm sm:grid-cols-2">
            <Detail label="Customer" value={booking.full_name} />
            <Detail label="Email" value={booking.email} />
            <Detail label="Phone" value={booking.phone || '-'} />
            <Detail label="Amount" value={formatBookingAmount(booking)} />
            <Detail label="Sankalp Name" value={booking.sankalp_name || '-'} />
            <Detail label="Gotra" value={booking.gotra || '-'} />
            <Detail label="Rashi" value={booking.rashi || '-'} />
            <Detail label="Nakshatra" value={booking.nakshatra || '-'} />
            <Detail label="Date of Birth" value={formatDate(booking.date_of_birth)} />
            <Detail label="Birth Time" value={booking.birth_time?.slice(0, 5) || '-'} />
            <Detail label="Birth Place" value={booking.birth_place || '-'} />
            <Detail label="Preferred Date" value={formatDate(booking.preferred_date)} />
            <Detail label="Payment Method" value={booking.payment_method || '-'} />
            <Detail label="Razorpay Payment" value={booking.razorpay_payment_id || '-'} />
          </section>

          {booking.message && (
            <div className="rounded-lg border border-gray-100 bg-white p-4 text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Message</p>
              <p className="text-gray-700">{booking.message}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Service status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={readOnly}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-400 disabled:bg-gray-50"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </Field>
            <Field label="Muhurat / scheduled date">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={readOnly}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-400 disabled:bg-gray-50"
              />
            </Field>
            <Field label="Muhurat note">
              <input
                value={muhuratNote}
                onChange={(e) => setMuhuratNote(e.target.value)}
                disabled={readOnly}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-400 disabled:bg-gray-50"
              />
            </Field>
            <Field label="Recording link">
              <input
                value={recordingLink}
                onChange={(e) => setRecordingLink(e.target.value)}
                disabled={readOnly}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-400 disabled:bg-gray-50"
              />
            </Field>
          </div>

          <Field label="Internal admin notes">
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              disabled={readOnly}
              className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-400 disabled:bg-gray-50"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          {readOnly ? null : (
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-gray-800">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  );
}
