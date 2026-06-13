'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search, UserRound, Users, Repeat, TrendingUp, IndianRupee } from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminAnalyticsPanel, AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { RevenueTrendChart, fmtInr } from '@/components/admin/AdminCharts';

interface CustomerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  rashi: string | null;
  updated_at: string;
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    summary: { totalCustomers: number; newCustomers30d: number; repeatCustomers: number; customersWithOrders: number; totalCustomerRevenue: number };
    signupTrend: Array<{ date: string; label: string; orders: number; revenue: number }>;
  } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(CUSTOMERS_PER_PAGE) });
    if (search) params.set('search', search);
    const response = await fetch(`/api/admin/customers?${params.toString()}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { customers?: CustomerRow[]; total?: number; total_pages?: number } | null;
    const nextCustomers = data?.customers ?? [];
    setCustomers(nextCustomers);
    setTotal(data?.total ?? 0);
    setTotalPages(data?.total_pages ?? 1);
    setSelectedId((current) => nextCustomers.some((customer) => customer.id === current) ? current : nextCustomers[0]?.id ?? null);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetch('/api/admin/customers/analytics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setAnalytics(data); })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchCustomers(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchCustomers]);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/admin/customers/${selectedId}/timeline`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: { timeline?: TimelineItem[] }) => setTimeline(data.timeline ?? []))
      .catch(() => setTimeline([]));
  }, [selectedId]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Customer CRM" description="Timeline of orders, consultations, reviews, and customer activity." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total customers" value={(analytics?.summary.totalCustomers ?? total).toLocaleString('en-IN')} icon={Users} tone="text-blue-600" bg="bg-blue-50" />
        <AdminStatCard label="New (30 days)" value={(analytics?.summary.newCustomers30d ?? 0).toLocaleString('en-IN')} icon={TrendingUp} tone="text-green-600" bg="bg-green-50" />
        <AdminStatCard label="Repeat buyers" value={(analytics?.summary.repeatCustomers ?? 0).toLocaleString('en-IN')} icon={Repeat} tone="text-amber-600" bg="bg-amber-50" />
        <AdminStatCard label="Customer revenue" value={fmtInr(analytics?.summary.totalCustomerRevenue ?? 0)} icon={IndianRupee} tone="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <AdminAnalyticsPanel title="Signup trend" subtitle="New customer registrations · last 30 days" open={analyticsOpen} onToggle={() => setAnalyticsOpen((v) => !v)}>
        {analytics ? <RevenueTrendChart data={analytics.signupTrend} /> : <p className="text-sm text-gray-400">Loading analytics…</p>}
      </AdminAnalyticsPanel>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search customers..." className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-xl border border-gray-200 bg-white">
          {loading ? <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-amber-600" /></div> : customers.map((customer) => (
            <button key={customer.id} onClick={() => setSelectedId(customer.id)} className={`flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left last:border-0 ${selectedId === customer.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500"><UserRound className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{customer.full_name ?? 'Unnamed customer'}</p>
                <p className="truncate text-xs text-gray-500">{customer.email ?? customer.phone ?? customer.whatsapp ?? 'No contact'}</p>
                {customer.rashi && <p className="mt-1 text-[11px] text-amber-700">{customer.rashi}</p>}
              </div>
            </button>
          ))}
          <div className="px-4 pb-4">
            <AdminPagination page={page} totalPages={totalPages} total={total} perPage={CUSTOMERS_PER_PAGE} onPageChange={setPage} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {selectedId ? (
            timeline.length > 0 ? (
              <div className="space-y-3">
                {timeline.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="rounded-lg border border-gray-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{item.type.replace(/_/g, ' ')}</p>
                        {item.href ? <Link href={item.href} className="mt-1 block font-semibold text-gray-900 hover:underline">{item.title}</Link> : <p className="mt-1 font-semibold text-gray-900">{item.title}</p>}
                        {item.subtitle && <p className="mt-1 text-sm text-gray-500">{item.subtitle}</p>}
                      </div>
                      {item.status && <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium capitalize text-gray-600">{item.status.replace(/_/g, ' ')}</span>}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">{new Date(item.created_at).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            ) : <div className="py-16 text-center text-sm text-gray-500">No timeline activity found.</div>
          ) : <div className="py-16 text-center text-sm text-gray-500">Select a customer to view the timeline.</div>}
        </div>
      </div>
    </div>
  );
}