'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Clock, ExternalLink, FileText, IndianRupee, Layers, Loader2, Palette, Search, TrendingUp } from 'lucide-react';
import { AdminAnalyticsPanel, AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { MetricBars, RevenueTrendChart, fmtInr } from '@/components/admin/AdminCharts';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { useAdminAnalytics } from '@/components/admin/useAdminAnalytics';
import { formatPrice } from '@/lib/utils/format';

type ConfigurationRow = {
  id: string;
  product_id: string;
  setting_type: string | null;
  custom_design_url: string | null;
  custom_design_status: string | null;
  metal: string | null;
  ring_size: string | null;
  chain_length: string | null;
  total_price: number | null;
  delivery_eta_label: string | null;
  status: string;
  configuration_snapshot: unknown;
  created_at: string;
  product?: { id: string; name: string; sku: string | null; tag_number: string | null } | null;
};

type AnalyticsData = {
  summary: {
    totalConfigurations: number;
    withCustomDesign: number;
    pendingReview: number;
    convertedToOrders: number;
    conversionRate: number;
    totalQuotedValue: number;
    avgQuotedValue: number;
  };
  trend: Array<{ date: string; label: string; orders: number; revenue: number }>;
  statusBreakdown: Array<{ label: string; value: number; meta: number }>;
  metalBreakdown: Array<{ label: string; value: number; meta: number }>;
  settingBreakdown: Array<{ label: string; value: number; meta: number }>;
  customDesignBreakdown: Array<{ label: string; value: number; meta: number }>;
};

const PER_PAGE = 50;

function statusClass(status: string | null) {
  switch (status) {
    case 'pending_custom_design_review':
    case 'pending_review':
      return 'bg-amber-100 text-amber-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function snapshotSummary(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const summary = (snapshot as Record<string, unknown>).summary;
  return typeof summary === 'string' ? summary : null;
}

function snapshotCustomDesignBrief(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const selections = (snapshot as Record<string, unknown>).selections;
  if (!selections || typeof selections !== 'object' || Array.isArray(selections)) return null;
  const brief = (selections as Record<string, unknown>).custom_design_brief;
  if (!brief || typeof brief !== 'object' || Array.isArray(brief)) return null;
  const description = (brief as Record<string, unknown>).description;
  const contactPhone = (brief as Record<string, unknown>).contact_phone;
  if (typeof description !== 'string' || typeof contactPhone !== 'string') return null;
  return {
    description,
    contact_phone: contactPhone,
    preferred_metal:
      typeof (brief as Record<string, unknown>).preferred_metal === 'string'
        ? String((brief as Record<string, unknown>).preferred_metal)
        : undefined,
    additional_notes:
      typeof (brief as Record<string, unknown>).additional_notes === 'string'
        ? String((brief as Record<string, unknown>).additional_notes)
        : undefined,
  };
}

export default function AdminConfigurationsPage() {
  const [rows, setRows] = useState<ConfigurationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { analytics, loading: analyticsLoading, open: analyticsOpen, toggle } = useAdminAnalytics<AnalyticsData>('/api/admin/configurations/analytics');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search.trim()) params.set('q', search.trim());
    const res = await fetch(`/api/admin/configurations?${params.toString()}`, { cache: 'no-store' });
    const data = await res.json().catch(() => null) as { configurations?: ConfigurationRow[]; total?: number; total_pages?: number } | null;
    setRows(data?.configurations ?? []);
    setTotal(data?.total ?? 0);
    setTotalPages(data?.total_pages ?? 1);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { void fetchRows(); }, [fetchRows]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configurations"
        description="Review saved configurations, custom design uploads, verified totals, and delivery ETAs."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total saved" value={(analytics?.summary.totalConfigurations ?? total).toLocaleString('en-IN')} icon={Layers} tone="text-gray-900" bg="bg-gray-50" />
        <AdminStatCard label="Custom designs" value={(analytics?.summary.withCustomDesign ?? 0).toLocaleString('en-IN')} icon={Palette} tone="text-amber-600" bg="bg-amber-50" subtext={`${analytics?.summary.pendingReview ?? 0} pending review`} />
        <AdminStatCard label="Converted to orders" value={(analytics?.summary.convertedToOrders ?? 0).toLocaleString('en-IN')} icon={TrendingUp} tone="text-green-600" bg="bg-green-50" subtext={`${analytics?.summary.conversionRate ?? 0}% conversion`} />
        <AdminStatCard label="Quoted value" value={fmtInr(analytics?.summary.totalQuotedValue ?? 0)} icon={IndianRupee} tone="text-emerald-600" bg="bg-emerald-50" subtext={analytics?.summary.avgQuotedValue ? `Avg ${fmtInr(analytics.summary.avgQuotedValue)}` : undefined} />
      </div>

      <AdminAnalyticsPanel title="Configurator analytics" subtitle="Saved configs & funnel · last 30 days" loading={analyticsLoading} open={analyticsOpen} onToggle={toggle}>
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-3">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Configuration trend</h3>
            {analytics ? <RevenueTrendChart data={analytics.trend} /> : null}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-2">
            <MetricBars embedded title="Custom design funnel" icon={Palette} items={analytics?.customDesignBreakdown ?? []} />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <MetricBars embedded title="Status" icon={BarChart3} items={analytics?.statusBreakdown.slice(0, 6) ?? []} />
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <MetricBars embedded title="Metal choice" icon={Layers} items={analytics?.metalBreakdown.slice(0, 6) ?? []} />
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <MetricBars embedded title="Setting type" icon={FileText} items={analytics?.settingBreakdown.slice(0, 6) ?? []} />
          </div>
        </div>
      </AdminAnalyticsPanel>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search metal, setting…" className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending review</option>
          <option value="pending_custom_design_review">Custom design review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Configuration</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Options</th>
                    <th className="px-4 py-3">ETA</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No saved configurations found.</td></tr>
                  ) : rows.map((row) => (
                    <tr key={row.id} className="align-top hover:bg-gray-50/70">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                            {row.custom_design_url ? <Palette className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-mono text-xs text-gray-500">{row.id.slice(0, 8)}</p>
                            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.custom_design_status ?? row.status)}`}>
                              {(row.custom_design_status ?? row.status).replace(/_/g, ' ')}
                            </span>
                            <p className="mt-1 text-xs text-gray-400">{new Date(row.created_at).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{row.product?.name ?? 'Unknown product'}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {row.product?.sku ? `SKU ${row.product.sku}` : 'No SKU'}
                          {row.product?.tag_number ? ` · Tag ${row.product.tag_number}` : ''}
                        </p>
                        {snapshotSummary(row.configuration_snapshot) && (
                          <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-500">
                            {snapshotSummary(row.configuration_snapshot)}
                          </p>
                        )}
                        {snapshotCustomDesignBrief(row.configuration_snapshot) && (
                          <div className="mt-2 max-w-sm rounded-lg border border-amber-100 bg-amber-50/70 p-2 text-xs text-amber-950">
                            <p className="font-semibold">Custom design request</p>
                            <p className="mt-1 leading-relaxed">
                              {snapshotCustomDesignBrief(row.configuration_snapshot)?.description}
                            </p>
                            <p className="mt-1 text-amber-800">
                              Contact: {snapshotCustomDesignBrief(row.configuration_snapshot)?.contact_phone}
                            </p>
                            {snapshotCustomDesignBrief(row.configuration_snapshot)?.preferred_metal ? (
                              <p className="mt-1 text-amber-800">
                                Preferred metal:{' '}
                                {snapshotCustomDesignBrief(row.configuration_snapshot)?.preferred_metal}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        <div className="flex flex-wrap gap-1.5">
                          {[row.setting_type, row.metal, row.ring_size, row.chain_length].filter(Boolean).map((item) => (
                            <span key={item} className="rounded bg-gray-100 px-2 py-1">{String(item).replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        {row.delivery_eta_label ? (
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-amber-600" />{row.delivery_eta_label}</span>
                        ) : 'Not calculated'}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">{formatPrice(row.total_price ?? 0)}</td>
                      <td className="px-4 py-4">
                        {row.custom_design_url ? (
                          <Link href={row.custom_design_url} target="_blank" className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50">
                            Open file <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : <span className="text-xs text-gray-400">Standard design</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <AdminPagination page={page} totalPages={totalPages} total={total} perPage={PER_PAGE} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
