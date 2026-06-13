'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Loader2, Megaphone, RefreshCw, Send, CheckCircle, AlertTriangle, Radio } from 'lucide-react';
import type { NOTIFICATION_TEMPLATE_LIBRARY } from '@/lib/constants/notification-templates';
import { AdminAnalyticsPanel, AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { MetricBars, RevenueTrendChart } from '@/components/admin/AdminCharts';

interface NotificationLogRow {
  id: string;
  type: string;
  recipient: string;
  template: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface BroadcastRow {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

type TemplateRow = (typeof NOTIFICATION_TEMPLATE_LIBRARY)[number];

const BROADCAST_TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'offer', label: 'Special Offer' },
  { value: 'update', label: 'Site Update' },
] as const;

export default function AdminNotificationsPage() {
  const [logs, setLogs] = useState<NotificationLogRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState(true);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    href: '',
    type: 'announcement',
    expiresAt: '',
  });
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [analytics, setAnalytics] = useState<{
    summary: { totalLogs: number; sentCount: number; failedCount: number; successRate: number; activeBroadcasts: number; totalBroadcasts: number };
    trend: Array<{ date: string; label: string; orders: number; revenue: number }>;
    statusBreakdown: Array<{ label: string; value: number; meta: number }>;
    typeBreakdown: Array<{ label: string; value: number; meta: number }>;
  } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`/api/admin/notifications${params}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { logs?: NotificationLogRow[]; templates?: TemplateRow[] } | null;
    setLogs(data?.logs ?? []);
    setTemplates(data?.templates ?? []);
    setLoading(false);
  }, [status]);

  const fetchBroadcasts = useCallback(async () => {
    setBroadcastLoading(true);
    const response = await fetch('/api/admin/broadcast-notifications', { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { broadcasts?: BroadcastRow[] } | null;
    setBroadcasts(data?.broadcasts ?? []);
    setBroadcastLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLogs();
      void fetchBroadcasts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs, fetchBroadcasts]);

  useEffect(() => {
    fetch('/api/admin/notifications/analytics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setAnalytics(data); })
      .catch(() => undefined);
  }, []);

  async function sendBroadcast(event: React.FormEvent) {
    event.preventDefault();
    setSendingBroadcast(true);
    setBroadcastMessage('');

    const response = await fetch('/api/admin/broadcast-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: broadcastForm.title,
        message: broadcastForm.message,
        href: broadcastForm.href || null,
        type: broadcastForm.type,
        expiresAt: broadcastForm.expiresAt || null,
      }),
    });

    const data = await response.json().catch(() => null) as { error?: string } | null;
    setSendingBroadcast(false);

    if (!response.ok) {
      setBroadcastMessage(data?.error ?? 'Failed to send broadcast.');
      return;
    }

    setBroadcastForm({ title: '', message: '', href: '', type: 'announcement', expiresAt: '' });
    setBroadcastMessage('Broadcast sent. It is now visible to all visitors in the notification bell.');
    void fetchBroadcasts();
  }

  async function toggleBroadcast(id: string, isActive: boolean) {
    await fetch('/api/admin/broadcast-notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    });
    void fetchBroadcasts();
  }

  async function retry(id: string) {
    setRetryingId(id);
    await fetch(`/api/admin/notifications/${id}/retry`, { method: 'POST' });
    setRetryingId(null);
    void fetchLogs();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Notifications & Automation" description="Template inventory, delivery logs, failures, and retry queue." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total deliveries" value={(analytics?.summary.totalLogs ?? logs.length).toLocaleString('en-IN')} icon={Megaphone} tone="text-gray-900" bg="bg-gray-50" />
        <AdminStatCard label="Success rate" value={`${analytics?.summary.successRate ?? 0}%`} icon={CheckCircle} tone="text-green-600" bg="bg-green-50" subtext={`${analytics?.summary.sentCount ?? 0} sent`} />
        <AdminStatCard label="Failed" value={(analytics?.summary.failedCount ?? 0).toLocaleString('en-IN')} icon={AlertTriangle} tone="text-red-600" bg="bg-red-50" />
        <AdminStatCard label="Active broadcasts" value={(analytics?.summary.activeBroadcasts ?? 0).toLocaleString('en-IN')} icon={Radio} tone="text-amber-600" bg="bg-amber-50" subtext={`${analytics?.summary.totalBroadcasts ?? 0} total`} />
      </div>

      <AdminAnalyticsPanel title="Delivery analytics" subtitle="Notification volume & status · last 30 days" open={analyticsOpen} onToggle={() => setAnalyticsOpen((v) => !v)}>
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-3">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Delivery trend</h3>
            {analytics ? <RevenueTrendChart data={analytics.trend} /> : null}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-2">
            <MetricBars embedded title="By status" icon={BarChart3} items={analytics?.statusBreakdown.slice(0, 6) ?? []} />
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <MetricBars embedded title="By channel type" icon={Megaphone} items={analytics?.typeBreakdown.slice(0, 8) ?? []} />
        </div>
      </AdminAnalyticsPanel>

      <div className="flex justify-end rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50/40 p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">In-App Broadcasts</h2>
            <p className="mt-1 text-sm text-gray-600">
              Send announcements, offers, and updates to everyone through the site notification bell — logged in or not.
            </p>
          </div>
        </div>

        <form onSubmit={sendBroadcast} className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Title</span>
            <input
              value={broadcastForm.title}
              onChange={(event) => setBroadcastForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="Festive Sale Live"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Type</span>
            <select
              value={broadcastForm.type}
              onChange={(event) => setBroadcastForm((current) => ({ ...current, type: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            >
              {BROADCAST_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm lg:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">Message</span>
            <textarea
              value={broadcastForm.message}
              onChange={(event) => setBroadcastForm((current) => ({ ...current, message: event.target.value }))}
              className="min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="Get 10% off on certified Navaratna gems this week."
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Optional link</span>
            <input
              value={broadcastForm.href}
              onChange={(event) => setBroadcastForm((current) => ({ ...current, href: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="/shop/navaratna"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Expires on (optional)</span>
            <input
              type="datetime-local"
              value={broadcastForm.expiresAt}
              onChange={(event) => setBroadcastForm((current) => ({ ...current, expiresAt: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </label>
          <div className="flex items-center gap-3 lg:col-span-2">
            <button
              type="submit"
              disabled={sendingBroadcast}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-60"
            >
              {sendingBroadcast ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to Everyone
            </button>
            {broadcastMessage ? <p className="text-sm text-gray-600">{broadcastMessage}</p> : null}
          </div>
        </form>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Recent Broadcasts
          </div>
          {broadcastLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-amber-600" /></div>
          ) : broadcasts.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">No broadcasts sent yet.</div>
          ) : (
            broadcasts.map((broadcast) => (
              <div key={broadcast.id} className="grid gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-0 md:grid-cols-[1.2fr_1.6fr_auto_auto] md:items-center">
                <div>
                  <p className="font-semibold text-gray-900">{broadcast.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-amber-700">{broadcast.type}</p>
                </div>
                <p className="text-gray-600">{broadcast.message}</p>
                <span className={`text-xs font-semibold uppercase ${broadcast.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {broadcast.is_active ? 'Active' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleBroadcast(broadcast.id, !broadcast.is_active)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {broadcast.is_active ? 'Hide' : 'Show'}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {templates.map((template) => (
          <div key={template.key} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{template.channel.replace(/_/g, ' ')}</p>
            <h2 className="mt-1 font-semibold text-gray-900">{template.label}</h2>
            <p className="mt-2 text-xs text-gray-500">{template.trigger}</p>
            <p className="mt-2 text-[11px] font-medium text-gray-400">Consent: {template.consent}</p>
          </div>
        ))}
      </section>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">No notification logs found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-[1.2fr_1.4fr_0.8fr_0.8fr_auto] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Template</span><span>Recipient</span><span>Status</span><span>Created</span><span>Retry</span>
          </div>
          {logs.map((log) => (
            <div key={log.id} className="grid grid-cols-[1.2fr_1.4fr_0.8fr_0.8fr_auto] gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-0">
              <div><p className="font-medium text-gray-900">{log.template ?? log.type}</p>{log.error_message && <p className="mt-1 text-xs text-red-600">{log.error_message}</p>}</div>
              <span className="truncate text-gray-600">{log.recipient}</span>
              <span className="capitalize text-gray-600">{log.status}</span>
              <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('en-IN')}</span>
              <button type="button" onClick={() => retry(log.id)} disabled={retryingId === log.id} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60" aria-label="Retry notification">
                <RefreshCw className={retryingId === log.id ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}