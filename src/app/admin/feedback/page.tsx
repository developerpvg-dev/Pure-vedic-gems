'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Check, Loader2, MessageSquare, Search, Star, X } from 'lucide-react';
import { AdminAnalyticsPanel, AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { MetricBars, RevenueTrendChart } from '@/components/admin/AdminCharts';

interface FeedbackItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  rating: number;
  subject: string | null;
  message: string;
  allow_display: boolean;
  status: string;
  is_featured: boolean;
  created_at: string;
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    summary: { totalFeedback: number; pending: number; approved: number; rejected: number; displayAllowed: number; featured: number; avgRating: number };
    trend: Array<{ date: string; label: string; orders: number; revenue: number }>;
    statusBreakdown: Array<{ label: string; value: number; meta: number }>;
    ratingBreakdown: Array<{ label: string; value: number; meta: number }>;
  } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status });
    if (search.trim()) params.set('q', search.trim());
    const response = await fetch(`/api/admin/feedback?${params.toString()}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { feedback?: FeedbackItem[] } | null;
    setItems(data?.feedback ?? []);
    setLoading(false);
  }, [status, search]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  useEffect(() => {
    fetch('/api/admin/feedback/analytics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setAnalytics(data); })
      .catch(() => undefined);
  }, []);

  async function updateFeedback(id: string, update: Record<string, unknown>) {
    setSavingId(id);
    await fetch(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    setSavingId(null);
    void fetchItems();
  }

  const filteredItems = search.trim()
    ? items.filter((item) => {
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q)
          || (item.email?.toLowerCase().includes(q) ?? false)
          || (item.subject?.toLowerCase().includes(q) ?? false)
          || item.message.toLowerCase().includes(q);
      })
    : items;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Feedback Moderation" description="Approve, reject, publish, and feature public feedback submissions." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total feedback" value={(analytics?.summary.totalFeedback ?? items.length).toLocaleString('en-IN')} icon={MessageSquare} tone="text-gray-900" bg="bg-gray-50" />
        <AdminStatCard label="Pending review" value={(analytics?.summary.pending ?? 0).toLocaleString('en-IN')} icon={Loader2} tone="text-amber-600" bg="bg-amber-50" />
        <AdminStatCard label="Approved" value={(analytics?.summary.approved ?? 0).toLocaleString('en-IN')} icon={Check} tone="text-green-600" bg="bg-green-50" subtext={`${analytics?.summary.featured ?? 0} featured`} />
        <AdminStatCard label="Avg rating" value={analytics?.summary.avgRating ? `${analytics.summary.avgRating} / 5` : '—'} icon={Star} tone="text-yellow-600" bg="bg-yellow-50" />
      </div>

      <AdminAnalyticsPanel title="Feedback analytics" subtitle="Submissions & ratings · last 30 days" open={analyticsOpen} onToggle={() => setAnalyticsOpen((v) => !v)}>
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-3">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Submission trend</h3>
            {analytics ? <RevenueTrendChart data={analytics.trend} /> : null}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-2">
            <MetricBars embedded title="Rating distribution" icon={Star} items={analytics?.ratingBreakdown ?? []} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <MetricBars embedded title="Status breakdown" icon={BarChart3} items={analytics?.statusBreakdown ?? []} />
        </div>
      </AdminAnalyticsPanel>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feedback..." className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">No feedback found.</div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">{item.status}</span>
                    {item.allow_display && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Display allowed</span>}
                    {item.is_featured && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Featured</span>}
                  </div>
                  <div className="mt-2 flex gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4" fill={index < item.rating ? 'currentColor' : 'none'} />)}
                  </div>
                  {item.subject && <h2 className="mt-3 font-semibold text-gray-900">{item.subject}</h2>}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{item.message}</p>
                  <p className="mt-3 text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleString('en-IN')}
                    {item.location ? ` · ${item.location}` : ''}
                    {item.email ? ` · ${item.email}` : ''}
                    {item.phone ? ` · ${item.phone}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => updateFeedback(item.id, { status: 'approved', allow_display: true })} disabled={savingId === item.id} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><Check className="h-3.5 w-3.5" />Approve</button>
                  <button onClick={() => updateFeedback(item.id, { status: 'rejected', is_featured: false })} disabled={savingId === item.id} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><X className="h-3.5 w-3.5" />Reject</button>
                  <button onClick={() => updateFeedback(item.id, { is_featured: !item.is_featured, status: 'approved', allow_display: true })} disabled={savingId === item.id} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60"><Star className="h-3.5 w-3.5" />{item.is_featured ? 'Unfeature' : 'Feature'}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
