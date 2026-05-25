'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Star, X } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/feedback?status=${status}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { feedback?: FeedbackItem[] } | null;
    setItems(data?.feedback ?? []);
    setLoading(false);
  }, [status]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

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

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Moderation</h1>
          <p className="mt-1 text-sm text-gray-500">Approve, reject, publish, and feature public feedback submissions.</p>
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
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">No feedback found.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
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
