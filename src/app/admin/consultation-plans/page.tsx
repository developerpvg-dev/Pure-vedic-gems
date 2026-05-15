'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, ImageIcon, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';

type PlanColor = 'amber' | 'violet' | 'emerald' | 'blue' | 'orange' | 'rose';

interface ConsultationPlanMetadata {
  card_color?: PlanColor;
  image_url?: string | null;
  badge_label?: string | null;
  mode_label?: string | null;
  details?: string | null;
  highlights?: string[];
}

interface ConsultationPlan {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  amount_inr: number | string;
  amount_usd: number | string | null;
  currency: string;
  duration_minutes: number | null;
  is_active: boolean;
  sort_order: number;
  metadata: ConsultationPlanMetadata | Record<string, unknown> | null;
  created_at: string;
}

interface PlanFormState {
  title: string;
  slug: string;
  description: string;
  amount_inr: string;
  amount_usd: string;
  duration_minutes: string;
  is_active: boolean;
  sort_order: string;
  card_color: PlanColor;
  image_url: string;
  badge_label: string;
  mode_label: string;
  highlights: string;
  details: string;
}

const COLOR_OPTIONS: { value: PlanColor; label: string; className: string }[] = [
  { value: 'amber', label: 'Amber', className: 'bg-amber-500' },
  { value: 'violet', label: 'Violet', className: 'bg-violet-500' },
  { value: 'emerald', label: 'Emerald', className: 'bg-emerald-500' },
  { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
  { value: 'orange', label: 'Orange', className: 'bg-orange-500' },
  { value: 'rose', label: 'Rose', className: 'bg-rose-500' },
];

function emptyForm(): PlanFormState {
  return {
    title: '',
    slug: '',
    description: '',
    amount_inr: '',
    amount_usd: '',
    duration_minutes: '',
    is_active: true,
    sort_order: '0',
    card_color: 'amber',
    image_url: '',
    badge_label: '',
    mode_label: '',
    highlights: '',
    details: '',
  };
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function readMetadata(plan: ConsultationPlan): ConsultationPlanMetadata {
  if (!plan.metadata || typeof plan.metadata !== 'object' || Array.isArray(plan.metadata)) return {};
  return plan.metadata as ConsultationPlanMetadata;
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatPrice(value: number | string | null) {
  const amount = Number(value ?? 0);
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

function formatApiError(data: { error?: string; details?: Record<string, string[]> }) {
  const details = data.details ? Object.values(data.details).flat().filter(Boolean).join(', ') : '';
  return [data.error, details].filter(Boolean).join(': ') || 'Failed to save plan';
}

export default function ConsultationPlansPage() {
  const [plans, setPlans] = useState<ConsultationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormState>(() => emptyForm());

  const activeCount = useMemo(() => plans.filter((plan) => plan.is_active).length, [plans]);

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
    setForm(emptyForm());
    setError('');
    setShowModal(true);
  }

  function openEdit(plan: ConsultationPlan) {
    const metadata = readMetadata(plan);
    setEditingId(plan.id);
    setForm({
      title: plan.title,
      slug: plan.slug,
      description: plan.description ?? '',
      amount_inr: String(plan.amount_inr ?? ''),
      amount_usd: plan.amount_usd == null ? '' : String(plan.amount_usd),
      duration_minutes: plan.duration_minutes == null ? '' : String(plan.duration_minutes),
      is_active: plan.is_active,
      sort_order: String(plan.sort_order ?? 0),
      card_color: metadata.card_color ?? 'amber',
      image_url: metadata.image_url ?? '',
      badge_label: metadata.badge_label ?? '',
      mode_label: metadata.mode_label ?? '',
      highlights: Array.isArray(metadata.highlights) ? metadata.highlights.join('\n') : '',
      details: metadata.details ?? '',
    });
    setError('');
    setShowModal(true);
  }

  function updateTitle(value: string) {
    setForm((prev) => ({ ...prev, title: value, slug: editingId || prev.slug ? prev.slug : makeSlug(value) }));
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploadingImage(true);
    setError('');

    const formData = new FormData();
    formData.append('files', file);
    formData.append('folder', 'consultation-plans');

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.urls?.[0]) {
        throw new Error(data.error || 'Image upload failed');
      }
      setForm((prev) => ({ ...prev, image_url: data.urls[0] }));
      if (data.errors?.length) setError(data.errors.join('; '));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
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
    if (!form.amount_inr || Number(form.amount_inr) < 1) {
      setError('INR price is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        slug: makeSlug(form.slug),
        description: form.description.trim() || null,
        amount_inr: Number(form.amount_inr),
        amount_usd: form.amount_usd === '' ? null : Number(form.amount_usd),
        currency: 'INR',
        duration_minutes: form.duration_minutes === '' ? null : Number(form.duration_minutes),
        is_active: form.is_active,
        sort_order: Number(form.sort_order || 0),
        metadata: {
          card_color: form.card_color,
          image_url: form.image_url.trim() || null,
          badge_label: form.badge_label.trim() || null,
          mode_label: form.mode_label.trim() || null,
          details: form.details.trim() || null,
          highlights: splitLines(form.highlights),
        },
      };

      const url = editingId ? `/api/admin/consultation-plans/${editingId}` : '/api/admin/consultation-plans';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(formatApiError(data));
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

  async function deletePlan(plan: ConsultationPlan) {
    if (!confirm(`Delete "${plan.title}"? Existing consultation records keep their saved plan title and price.`)) return;
    try {
      const res = await fetch(`/api/admin/consultation-plans/${plan.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete plan');
      await fetchPlans();
    } catch {
      setError('Failed to delete plan');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Consultation Catalog</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Consultation Plans</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, edit, publish, and delete paid consultation plans. {activeCount} active of {plans.length} total.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      {error && !showModal && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <CalendarClock className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">No consultation plans yet</p>
          <button type="button" onClick={openCreate} className="mt-3 text-sm font-semibold text-amber-600 hover:underline">
            Add your first plan
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Visual</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">INR</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Duration</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Sort</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((plan) => {
                  const metadata = readMetadata(plan);
                  const color = COLOR_OPTIONS.find((option) => option.value === metadata.card_color) ?? COLOR_OPTIONS[0];
                  return (
                    <tr key={plan.id} className={!plan.is_active ? 'bg-gray-50 opacity-70' : ''}>
                      <td className="max-w-md px-4 py-4">
                        <p className="font-semibold text-gray-950">{plan.title}</p>
                        <p className="mt-0.5 text-xs text-gray-500">/{plan.slug}</p>
                        {plan.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{plan.description}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                            {metadata.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={metadata.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <span className={`mb-1 block h-3 w-8 rounded-full ${color.className}`} />
                            <p className="text-xs font-medium text-gray-500">{color.label}</p>
                            {metadata.badge_label && <p className="text-xs text-amber-700">{metadata.badge_label}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-950">{formatPrice(plan.amount_inr)}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{plan.duration_minutes ? `${plan.duration_minutes} min` : '-'}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{plan.sort_order}</td>
                      <td className="px-4 py-4 text-center">
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
                      <td className="px-4 py-4 text-right">
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
                            onClick={() => deletePlan(plan)}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${plan.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-950">{editingId ? 'Edit Consultation Plan' : 'Add Consultation Plan'}</h2>
                <p className="text-xs text-gray-500">Plan details, card image, color, and popup content.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextInput label="Title" required value={form.title} onChange={updateTitle} className="sm:col-span-2" />
                  <TextInput label="Slug" required value={form.slug} onChange={(value) => setForm((prev) => ({ ...prev, slug: makeSlug(value) }))} className="sm:col-span-2" />
                  <TextInput label="Price INR" required type="number" min="1" value={form.amount_inr} onChange={(value) => setForm((prev) => ({ ...prev, amount_inr: value }))} />
                  <TextInput label="Price USD" type="number" min="0" value={form.amount_usd} onChange={(value) => setForm((prev) => ({ ...prev, amount_usd: value }))} />
                  <TextInput label="Duration Minutes" type="number" min="1" value={form.duration_minutes} onChange={(value) => setForm((prev) => ({ ...prev, duration_minutes: value }))} />
                  <TextInput label="Sort Order" type="number" min="0" value={form.sort_order} onChange={(value) => setForm((prev) => ({ ...prev, sort_order: value }))} />

                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">Short Description</span>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </label>

                  <div className="sm:col-span-2">
                    <span className="mb-2 block text-xs font-semibold text-gray-600">Card Color</span>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((color) => {
                        const active = form.card_color === color.value;
                        return (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, card_color: color.value }))}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${active ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}
                          >
                            <span className={`h-3 w-3 rounded-full ${color.className}`} />
                            {color.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">Card Image</span>
                    <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                      <div className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        {form.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={form.image_url} alt="Plan card preview" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-gray-300" />
                        )}
                      </div>
                      <div className="space-y-3">
                        <input
                          value={form.image_url}
                          onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
                          placeholder="Paste an image URL or upload below"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                        />
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-amber-500 hover:text-amber-700">
                          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {uploadingImage ? 'Uploading...' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(event) => {
                              uploadImage(event.target.files?.[0]);
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <TextInput label="Badge Label" value={form.badge_label} onChange={(value) => setForm((prev) => ({ ...prev, badge_label: value }))} placeholder="Most Popular" />
                  <TextInput label="Mode Label" value={form.mode_label} onChange={(value) => setForm((prev) => ({ ...prev, mode_label: value }))} placeholder="Telephonic / Skype" />

                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">Highlights</span>
                    <textarea
                      rows={4}
                      value={form.highlights}
                      onChange={(event) => setForm((prev) => ({ ...prev, highlights: event.target.value }))}
                      placeholder="One highlight per line"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">Popup Details</span>
                    <textarea
                      rows={6}
                      value={form.details}
                      onChange={(event) => setForm((prev) => ({ ...prev, details: event.target.value }))}
                      placeholder="Full plan details shown after clicking See Details"
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
                    Show this plan on the public consultation page
                  </label>
                </div>
              </div>

              <aside className="h-fit rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Card Preview</p>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">01</span>
                    {form.badge_label && <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase text-white">{form.badge_label}</span>}
                  </div>
                  <div className="mt-4 grid h-28 place-items-center overflow-hidden rounded-lg bg-white">
                    {form.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.image_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <h3 className="mt-4 line-clamp-3 text-center text-sm font-bold leading-5 text-gray-950">{form.title || 'Consultation Plan Title'}</h3>
                  <div className="mx-auto my-3 h-px w-10 bg-gray-200" />
                  <p className="text-center text-xl font-black text-amber-600">{form.amount_inr ? formatPrice(form.amount_inr) : 'Rs 0'}</p>
                  <div className="mt-4 space-y-2">
                    {splitLines(form.highlights).slice(0, 3).map((highlight) => (
                      <p key={highlight} className="text-xs text-gray-600">- {highlight}</p>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={savePlan}
                disabled={saving || uploadingImage}
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

function TextInput({
  label,
  value,
  onChange,
  required,
  type = 'text',
  min,
  placeholder,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-semibold text-gray-600">{label}{required ? ' *' : ''}</span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
      />
    </label>
  );
}