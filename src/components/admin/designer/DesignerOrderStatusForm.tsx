'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { DESIGNER_STATUS_OPTIONS } from '@/lib/orders/design-workflow';

interface DesignerOrderStatusFormProps {
  orderId: string;
  initialStatus: string;
  initialDesignNotes: string | null;
}

export function DesignerOrderStatusForm({
  orderId,
  initialStatus,
  initialDesignNotes,
}: DesignerOrderStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [designNotes, setDesignNotes] = useState(initialDesignNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const save = useCallback(async () => {
    setSaving(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/designer/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, design_notes: designNotes }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Update failed');
      return;
    }
    setMessage('Status updated. Customer can see progress on their order timeline.');
    router.refresh();
  }, [orderId, status, designNotes, router]);

  return (
    <section className="rounded-xl border border-indigo-200 bg-white p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-800">Update design status</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {DESIGNER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Design notes (internal)</label>
          <textarea
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="CAD notes, revisions, metal confirmation…"
          />
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save status
        </button>
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
