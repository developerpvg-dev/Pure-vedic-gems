'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Repeat,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminAnalyticsPanel, AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { SignupTrendChart, fmtInr, fmtInrCompact } from '@/components/admin/AdminCharts';
import type { CustomerAddress } from '@/lib/customer/address-book';
import { CUSTOMER_STATUS_LABELS, type CustomerAccountStatus } from '@/lib/customers/account-status';
import { toast } from 'sonner';

type CustomerSortMode = 'signup' | 'activity';
type DetailTab = 'profile' | 'activity';

interface CustomerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  rashi: string | null;
  account_status: CustomerAccountStatus;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

interface CustomerDetail {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  gotra: string | null;
  rashi: string | null;
  addresses: CustomerAddress[];
  default_address_index: number;
  account_status: CustomerAccountStatus;
  status_reason: string | null;
  status_changed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  total_orders: number;
  total_spent: number;
}

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  status: string | null;
  created_at: string;
  href?: string;
}

const CUSTOMERS_PER_PAGE = 20;

const TIMELINE_TYPE_LABELS: Record<string, string> = {
  signup: 'Signup',
  login: 'Login',
  order: 'Order',
  consultation: 'Consultation',
  yagya: 'Yagya booking',
  enquiry: 'Enquiry',
  review: 'Review',
  saved_item: 'Wishlist',
  cart: 'Cart',
  notification: 'Notification',
  in_app: 'In-app alert',
  reward: 'Rewards',
  account_status: 'Account status',
};

const ACCOUNT_STATUS_STYLES: Record<CustomerAccountStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-amber-100 text-amber-800',
  blocked: 'bg-red-100 text-red-700',
};

const TIMELINE_TYPE_STYLES: Record<string, string> = {
  signup: 'bg-emerald-100 text-emerald-800',
  login: 'bg-sky-100 text-sky-800',
  order: 'bg-amber-100 text-amber-800',
  consultation: 'bg-violet-100 text-violet-800',
  yagya: 'bg-orange-100 text-orange-800',
  enquiry: 'bg-blue-100 text-blue-800',
  review: 'bg-pink-100 text-pink-800',
  saved_item: 'bg-rose-100 text-rose-800',
  cart: 'bg-lime-100 text-lime-800',
  notification: 'bg-gray-100 text-gray-700',
  in_app: 'bg-indigo-100 text-indigo-800',
  reward: 'bg-yellow-100 text-yellow-800',
  account_status: 'bg-slate-100 text-slate-800',
};

function formatSignupLabel(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfCreated.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) return 'Joined today';
  if (dayDiff === 1) return 'Joined yesterday';
  if (dayDiff < 7) return `Joined ${dayDiff} days ago`;
  return created.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatActivityLabel(activityAt: string) {
  const activity = new Date(activityAt);
  const now = new Date();
  const diffMs = now.getTime() - activity.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Active just now';
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Active yesterday';
  if (diffDays < 7) return `Active ${diffDays} days ago`;
  return activity.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAddress(address: CustomerAddress) {
  return [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.pincode}`,
    address.country,
  ].filter(Boolean).join(', ');
}

function contactLine(customer: Pick<CustomerRow, 'email' | 'phone' | 'whatsapp'>) {
  return customer.email ?? customer.phone ?? customer.whatsapp ?? 'No contact saved';
}

function StatusBadge({ status }: { status: CustomerAccountStatus }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ACCOUNT_STATUS_STYLES[status]}`}>
      {CUSTOMER_STATUS_LABELS[status]}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm text-gray-800">{value}</p>
    </div>
  );
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon?: typeof Mail; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {title}
      </p>
      {children}
    </div>
  );
}

export default function AdminCustomersPage() {
  const detailRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortMode, setSortMode] = useState<CustomerSortMode>('signup');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('profile');
  const [analytics, setAnalytics] = useState<{
    summary: { totalCustomers: number; newCustomers30d: number; repeatCustomers: number; customersWithOrders: number; totalCustomerRevenue: number };
    signupTrend: Array<{ date: string; label: string; orders: number; revenue: number }>;
  } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadCustomerDetail = useCallback(async (customerId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, { cache: 'no-store' });
      const data = await response.json() as { customer?: CustomerDetail; error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Failed to load customer');
      setSelectedCustomer(data.customer ?? null);
      setStatusReason(data.customer?.status_reason ?? '');
    } catch (error) {
      setSelectedCustomer(null);
      toast.error(error instanceof Error ? error.message : 'Failed to load customer');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadTimeline = useCallback(async (customerId: string) => {
    setTimelineLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/timeline`, { cache: 'no-store' });
      const data = await response.json() as { timeline?: TimelineItem[] };
      setTimeline(data.timeline ?? []);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(CUSTOMERS_PER_PAGE),
      sort: sortMode,
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    const response = await fetch(`/api/admin/customers?${params.toString()}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null) as {
      customers?: CustomerRow[];
      total?: number;
      total_pages?: number;
    } | null;
    const nextCustomers = data?.customers ?? [];
    setCustomers(nextCustomers);
    setTotal(data?.total ?? 0);
    setTotalPages(data?.total_pages ?? 1);
    setSelectedId((current) => nextCustomers.some((customer) => customer.id === current) ? current : nextCustomers[0]?.id ?? null);
    setLoading(false);
  }, [page, debouncedSearch, sortMode]);

  const updateAccountStatus = useCallback(async (status: CustomerAccountStatus) => {
    if (!selectedId) return;
    if (status !== 'active') {
      const label = CUSTOMER_STATUS_LABELS[status].toLowerCase();
      if (!window.confirm(`Set this customer account to ${label}? They will be signed out and unable to log in.`)) {
        return;
      }
    }

    setStatusUpdating(true);
    try {
      const response = await fetch(`/api/admin/customers/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_status: status,
          reason: statusReason.trim() || undefined,
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Failed to update account status');

      toast.success(`Customer marked as ${CUSTOMER_STATUS_LABELS[status].toLowerCase()}`);
      await Promise.all([loadCustomerDetail(selectedId), loadTimeline(selectedId), fetchCustomers()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update account status');
    } finally {
      setStatusUpdating(false);
    }
  }, [selectedId, statusReason, loadCustomerDetail, loadTimeline, fetchCustomers]);

  const selectCustomer = useCallback((customerId: string) => {
    setSelectedId(customerId);
    setDetailTab('profile');
    setMobileShowDetail(true);
    window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  useEffect(() => {
    fetch('/api/admin/customers/analytics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setAnalytics(data); })
      .catch(() => undefined);
  }, []);

  // ponytail: debounce search so activity sort doesn't fire a serverless call per keystroke
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch((prev) => {
        const next = search.trim();
        if (prev !== next) setPage(1);
        return next;
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedCustomer(null);
      setTimeline([]);
      return;
    }
    void loadCustomerDetail(selectedId);
    void loadTimeline(selectedId);
  }, [selectedId, loadCustomerDetail, loadTimeline]);

  const selectedListCustomer = customers.find((customer) => customer.id === selectedId);

  return (
    <div className="min-w-0 max-w-full space-y-4 sm:space-y-5">
      <AdminPageHeader
        title="Customer CRM"
        description="Search, sort, and manage customer accounts with full profile details and activity history."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStatCard label="Total customers" value={(analytics?.summary.totalCustomers ?? total).toLocaleString('en-IN')} icon={Users} tone="text-blue-600" bg="bg-blue-50" />
        <AdminStatCard label="New (30 days)" value={(analytics?.summary.newCustomers30d ?? 0).toLocaleString('en-IN')} icon={TrendingUp} tone="text-green-600" bg="bg-green-50" />
        <AdminStatCard label="Repeat buyers" value={(analytics?.summary.repeatCustomers ?? 0).toLocaleString('en-IN')} icon={Repeat} tone="text-amber-600" bg="bg-amber-50" />
        <AdminStatCard label="Customer revenue" value={fmtInrCompact(analytics?.summary.totalCustomerRevenue ?? 0)} icon={IndianRupee} tone="text-emerald-600" bg="bg-emerald-50" subtext={analytics?.summary.totalCustomerRevenue ? fmtInr(analytics.summary.totalCustomerRevenue) : undefined} />
      </div>

      <AdminAnalyticsPanel
        title="Signup trend"
        subtitle="New customer registrations · last 30 days"
        open={analyticsOpen}
        onToggle={() => setAnalyticsOpen((v) => !v)}
      >
        {analytics ? <SignupTrendChart data={analytics.signupTrend} /> : <p className="text-sm text-gray-400">Loading analytics…</p>}
      </AdminAnalyticsPanel>

      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search by name, email, or phone..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              {total.toLocaleString('en-IN')} customers · page {page} of {totalPages}
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'signup' as const, label: 'Newest signup' },
                { id: 'activity' as const, label: 'Recent activity' },
              ]).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => { setSortMode(option.id); setPage(1); }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    sortMode === option.id
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:items-start">
        {/* Customer list */}
        <section
          className={`min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm ${
            mobileShowDetail ? 'hidden xl:flex' : 'flex'
          } xl:sticky xl:top-6 xl:max-h-[calc(100vh-7rem)] xl:flex-col`}
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-bold text-gray-900">Customers</h2>
            <p className="text-xs text-gray-500">Select a customer to view details</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              </div>
            ) : customers.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-500">No customers found.</div>
            ) : (
              customers.map((customer) => {
                const isSelected = selectedId === customer.id;
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => selectCustomer(customer.id)}
                    className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition last:border-0 ${
                      isSelected ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-semibold text-gray-900">{customer.full_name ?? 'Unnamed customer'}</p>
                        <StatusBadge status={customer.account_status ?? 'active'} />
                      </div>
                      <p className="mt-1 break-all text-xs text-gray-500">{contactLine(customer)}</p>
                      <p className={`mt-1 text-[11px] font-medium ${sortMode === 'activity' ? 'text-sky-700' : 'text-emerald-700'}`}>
                        {sortMode === 'activity'
                          ? formatActivityLabel(customer.last_activity_at)
                          : formatSignupLabel(customer.created_at)}
                      </p>
                      {customer.rashi ? <p className="mt-0.5 text-[11px] text-amber-700">{customer.rashi}</p> : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 px-3 py-3">
            <AdminPagination page={page} totalPages={totalPages} total={total} perPage={CUSTOMERS_PER_PAGE} onPageChange={setPage} />
          </div>
        </section>

        {/* Customer detail */}
        <section
          ref={detailRef}
          className={`min-w-0 space-y-4 ${mobileShowDetail ? 'block' : 'hidden xl:block'}`}
        >
          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={() => setMobileShowDetail(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </button>
          </div>

          {!selectedId ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
              <UserRound className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-700">Select a customer</p>
              <p className="mt-1 text-xs text-gray-500">Choose someone from the list to view profile, controls, and activity.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                {detailLoading && !selectedCustomer ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="break-words text-lg font-bold text-gray-900 sm:text-xl">
                            {selectedCustomer?.full_name ?? selectedListCustomer?.full_name ?? 'Unnamed customer'}
                          </h2>
                          {selectedCustomer ? <StatusBadge status={selectedCustomer.account_status} /> : null}
                        </div>
                        <p className="mt-1 break-all text-sm text-gray-600">
                          {selectedCustomer ? contactLine(selectedCustomer) : contactLine(selectedListCustomer ?? { email: null, phone: null, whatsapp: null })}
                        </p>
                      </div>
                      {selectedCustomer ? (
                        <div className="rounded-lg bg-gray-50 px-3 py-2 text-right text-xs text-gray-600">
                          <p className="font-semibold text-gray-900">{selectedCustomer.total_orders} orders</p>
                          <p>{fmtInr(selectedCustomer.total_spent)} spent</p>
                        </div>
                      ) : null}
                    </div>

                    {selectedCustomer ? (
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1">{formatSignupLabel(selectedCustomer.created_at)}</span>
                        {selectedCustomer.last_sign_in_at ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1">
                            Last login {new Date(selectedCustomer.last_sign_in_at).toLocaleString('en-IN')}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
                {([
                  { id: 'profile' as const, label: 'Profile & controls' },
                  { id: 'activity' as const, label: `Activity (${timeline.length})` },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                      detailTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {detailTab === 'profile' ? (
                detailLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  </div>
                ) : selectedCustomer ? (
                  <div className="space-y-4">
                    {selectedCustomer.status_reason && selectedCustomer.account_status !== 'active' ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <span className="font-semibold">Status note:</span> {selectedCustomer.status_reason}
                      </div>
                    ) : null}

                    <InfoCard title="Account controls">
                      <textarea
                        value={statusReason}
                        onChange={(event) => setStatusReason(event.target.value)}
                        placeholder="Optional internal note (saved with status changes)"
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          disabled={statusUpdating || selectedCustomer.account_status === 'active'}
                          onClick={() => void updateAccountStatus('active')}
                          className="rounded-lg bg-green-600 px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          disabled={statusUpdating || selectedCustomer.account_status === 'inactive'}
                          onClick={() => void updateAccountStatus('inactive')}
                          className="rounded-lg bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Deactivate
                        </button>
                        <button
                          type="button"
                          disabled={statusUpdating || selectedCustomer.account_status === 'blocked'}
                          onClick={() => void updateAccountStatus('blocked')}
                          className="rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Block
                        </button>
                      </div>
                    </InfoCard>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <InfoCard title="Contact" icon={Mail}>
                        <div className="space-y-3">
                          {selectedCustomer.email ? (
                            <div className="flex items-start gap-2 text-sm text-gray-800">
                              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                              <a href={`mailto:${selectedCustomer.email}`} className="break-all hover:underline">{selectedCustomer.email}</a>
                            </div>
                          ) : null}
                          {selectedCustomer.phone ? (
                            <div className="flex items-start gap-2 text-sm text-gray-800">
                              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                              <a href={`tel:${selectedCustomer.phone}`} className="break-all hover:underline">{selectedCustomer.phone}</a>
                            </div>
                          ) : null}
                          {selectedCustomer.whatsapp ? (
                            <div className="flex items-start gap-2 text-sm text-gray-800">
                              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                              <span className="break-all">WhatsApp: {selectedCustomer.whatsapp}</span>
                            </div>
                          ) : null}
                          {!selectedCustomer.email && !selectedCustomer.phone && !selectedCustomer.whatsapp ? (
                            <p className="text-sm text-gray-500">No contact details saved.</p>
                          ) : null}
                        </div>
                      </InfoCard>

                      <InfoCard title="Astrological profile" icon={Sparkles}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <DetailField label="Date of birth" value={formatDate(selectedCustomer.date_of_birth)} />
                          <DetailField label="Birth time" value={selectedCustomer.birth_time} />
                          <DetailField label="Birth place" value={selectedCustomer.birth_place} />
                          <DetailField label="Gotra" value={selectedCustomer.gotra} />
                          <DetailField label="Rashi" value={selectedCustomer.rashi} />
                        </div>
                        {!selectedCustomer.date_of_birth && !selectedCustomer.birth_time && !selectedCustomer.birth_place && !selectedCustomer.gotra && !selectedCustomer.rashi ? (
                          <p className="text-sm text-gray-500">No astrological details saved.</p>
                        ) : null}
                      </InfoCard>
                    </div>

                    <InfoCard title="Saved addresses" icon={MapPin}>
                      {selectedCustomer.addresses.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {selectedCustomer.addresses.map((address) => (
                            <div key={address.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">{address.label}</p>
                                {address.is_default ? (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                    Default
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-gray-700">{address.full_name}</p>
                              <p className="mt-1 break-words text-sm text-gray-600">{formatAddress(address)}</p>
                              <p className="mt-1 text-sm text-gray-500">{address.phone}</p>
                              {address.gst_number ? (
                                <p className="mt-2 break-words text-xs text-gray-500">
                                  GST: {address.gst_number}
                                  {address.gst_business_name ? ` · ${address.gst_business_name}` : ''}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No saved addresses yet.</p>
                      )}
                    </InfoCard>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
                    Could not load customer details.
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-700" />
                    <h3 className="text-sm font-semibold text-gray-800">Activity timeline</h3>
                  </div>
                  {timelineLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                    </div>
                  ) : timeline.length > 0 ? (
                    <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {timeline.map((item) => {
                        const typeLabel = TIMELINE_TYPE_LABELS[item.type] ?? item.type.replace(/_/g, ' ');
                        const typeStyle = TIMELINE_TYPE_STYLES[item.type] ?? 'bg-gray-100 text-gray-700';
                        return (
                          <div key={`${item.type}-${item.id}`} className="rounded-lg border border-gray-100 p-3 sm:p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <p className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${typeStyle}`}>
                                  {typeLabel}
                                </p>
                                {item.href ? (
                                  <Link href={item.href} className="mt-2 block break-words font-semibold text-gray-900 hover:underline">
                                    {item.title}
                                  </Link>
                                ) : (
                                  <p className="mt-2 break-words font-semibold text-gray-900">{item.title}</p>
                                )}
                                {item.subtitle ? <p className="mt-1 break-words text-sm text-gray-500">{item.subtitle}</p> : null}
                              </div>
                              {item.status ? (
                                <span className="inline-flex shrink-0 self-start rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium capitalize text-gray-600">
                                  {item.status.replace(/_/g, ' ')}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-xs text-gray-400">{new Date(item.created_at).toLocaleString('en-IN')}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-gray-500">No activity found for this customer yet.</div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
