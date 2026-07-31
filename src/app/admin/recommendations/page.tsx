'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageShell';
import type { RecommendationReportListItem } from '@/lib/recommendations/types';
import type { ReportCustomer } from '@/lib/recommendations/blocks';

export default function RecommendationsAdminPage() {
  const router = useRouter();
  const [reports, setReports] = useState<RecommendationReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'ready' | 'sent'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === 'all' ? '' : `?status=${filter}`;
      const res = await fetch(`/api/admin/recommendations${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setReports(data.reports ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createReport(template: 'gempundit-classic' | 'blank') {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      router.push(`/admin/recommendations/${data.report.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
      setCreating(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this report?')) return;
    const res = await fetch(`/api/admin/recommendations/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Delete failed');
      return;
    }
    toast.success('Deleted');
    void load();
  }

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Recommendation Reports"
        description="Build personalized gemstone recommendation PDFs and email them to customers."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={creating}
              onClick={() => createReport('gempundit-classic')}
              className="inline-flex items-center gap-1.5 rounded bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              New recommendation
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={() => createReport('blank')}
              className="inline-flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              Blank report
            </button>
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        {(['all', 'draft', 'ready', 'sent'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              filter === f ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-neutral-400" />
          <p className="text-sm text-neutral-600">No reports yet. Create a new recommendation to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const customer = r.customer as ReportCustomer;
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/recommendations/${r.id}`} className="font-medium text-amber-800 hover:underline">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      <div>{customer?.name || '—'}</div>
                      <div className="text-xs text-neutral-400">{customer?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize">{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(r.updated_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
