'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

interface ConsultationPlan {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  amount_inr: number;
  amount_usd: number | null;
  currency: string;
  duration_minutes: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  description: '',
  amount_inr: 0,
  amount_usd: '',
  duration_minutes: '',
  is_active: true,
  sort_order: 0,
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function formatPrice(value: number | null) {
  if (value == null) return 'Rs 0';
  return `Rs ${value.toLocaleString('en-IN')}`;
}

export default function ConsultationPlansPage() {
  const [plans, setPlans] = useState<ConsultationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/consultation-plans');
      if (!res.ok) throw new Error('Failed to load consultation plans');
      const data = await res.json();
      setPlans(data.plans ?? []);
    } catch {
      setError('Failed to load consultation plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(plan: ConsultationPlan) {
    setEditingId(plan.id);
    setForm({
      title: plan.title,
      slug: plan.slug,
      description: plan.description ?? '',
      amount_inr: plan.amount_inr,
      amount_usd: plan.amount_usd?.toString() ?? '',
      duration_minutes: plan.duration_minutes?.toString() ?? '',
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    });
    setError('');
    setShowModal(true);
  }

  function updateTitle(value: string) {
    setForm((prev) => ({ ...prev, title: value, slug: prev.slug ? prev.slug : makeSlug(value) }));
  }

  async function savePlan() {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        amount_inr: Number(form.amount_inr),
        amount_usd: form.amount_usd === '' ? null : Number(form.amount_usd),
        currency: 'INR',
        duration_minutes: form.duration_minutes === '' ? null : Number(form.duration_minutes),
        is_active: form.is_active,
        sort_order: Number(form.sort_order),
      };

      const url = editingId ? `/api/admin/consultation-plans/${editingId}` : '/api/admin/consultation-plans';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save plan');
      }
      setShowModal(false);
      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(plan: ConsultationPlan) {
    try {
      const res = await fetch(`/api/admin/consultation-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchPlans();
    } catch {
      setError('Failed to update plan status');
    }
  }

  async function deactivatePlan(plan: ConsultationPlan) {
    if (!confirm(`Deactivate "${plan.title}"? Existing bookings will keep their saved plan details.`)) return;
    try {
      const res = await fetch(`/api/admin/consultation-plans/${plan.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to deactivate plan');
      await fetchPlans();
    } catch {
      setError('Failed to deactivate plan');
    }
  }

  const activeCount = plans.filter((plan) => plan.is_active).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultation Plans</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage paid Vedic consultation services, prices, duration, and public visibility. {activeCount} active.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      {error && !showModal && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <CalendarClock className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">No consultation plans yet</p>
          <button type="button" onClick={openCreate} className="mt-3 text-sm font-semibold text-amber-600 hover:underline">
            Add your first plan
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Plan</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">INR</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">USD</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Duration</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Sort</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((plan) => (
                <tr key={plan.id} className={!plan.is_active ? 'bg-gray-50 opacity-70' : ''}>
                  <td className="max-w-md px-4 py-3">
                    <p className="font-semibold text-gray-900">{plan.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">/{plan.slug}</p>
                    {plan.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{plan.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">{formatPrice(plan.amount_inr)}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">{plan.amount_usd == null ? '-' : `$${plan.amount_usd}`}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{plan.duration_minutes ? `${plan.duration_minutes} min` : '-'}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{plan.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(plan)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        plan.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(plan)}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-amber-600"
                        aria-label={`Edit ${plan.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deactivatePlan(plan)}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Deactivate ${plan.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Consultation Plan' : 'Add Consultation Plan'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-gray-600">Title *</span>
                <input
                  value={form.title}
                  onChange={(event) => updateTitle(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-gray-600">Slug *</span>
                <input
                  value={form.slug}
                  onChange={(event) => setForm((prev) => ({ ...prev, slug: makeSlug(event.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-gray-600">Price INR *</span>
                <input
                  type="number"
                  min="1"
                  value={form.amount_inr}
                  onChange={(event) => setForm((prev) => ({ ...prev, amount_inr: Number(event.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-gray-600">Price USD</span>
                <input
                  type="number"
                  min="0"
                  value={form.amount_usd}
                  onChange={(event) => setForm((prev) => ({ ...prev, amount_usd: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-gray-600">Duration Minutes</span>
                <input
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={(event) => setForm((prev) => ({ ...prev, duration_minutes: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-gray-600">Sort Order</span>
                <input
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={(event) => setForm((prev) => ({ ...prev, sort_order: Number(event.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-gray-600">Description</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600"
                />
                Show this plan on the public booking page
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={savePlan}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}