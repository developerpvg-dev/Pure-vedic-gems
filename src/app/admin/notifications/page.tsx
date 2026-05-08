'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import type { NOTIFICATION_TEMPLATE_LIBRARY } from '@/lib/constants/notification-templates';

interface NotificationLogRow {
  id: string;
  type: string;
  recipient: string;
  template: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

type TemplateRow = (typeof NOTIFICATION_TEMPLATE_LIBRARY)[number];

export default function AdminNotificationsPage() {
  const [logs, setLogs] = useState<NotificationLogRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`/api/admin/notifications${params}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { logs?: NotificationLogRow[]; templates?: TemplateRow[] } | null;
    setLogs(data?.logs ?? []);
    setTemplates(data?.templates ?? []);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchLogs(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  async function retry(id: string) {
    setRetryingId(id);
    await fetch(`/api/admin/notifications/${id}/retry`, { method: 'POST' });
    setRetryingId(null);
    void fetchLogs();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Automation</h1>
          <p className="mt-1 text-sm text-gray-500">Template inventory, delivery logs, failures, and retry queue.</p>
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

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