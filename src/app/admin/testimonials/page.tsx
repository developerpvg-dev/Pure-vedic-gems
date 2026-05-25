'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Eye, Loader2, Pencil, Plus, Star, Trash2, Upload } from 'lucide-react';

interface TestimonialItem {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  rating: number;
  title: string | null;
  message: string;
  proof_image_url: string | null;
  proof_alt: string | null;
  source_url: string | null;
  status: string;
  is_active: boolean;
  show_on_homepage: boolean;
  sort_order: number;
  published_at: string;
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  location: '',
  rating: 5,
  title: '',
  message: '',
  proof_image_url: '',
  proof_alt: '',
  source_url: '',
  status: 'approved',
  is_active: true,
  show_on_homepage: false,
  sort_order: 0,
};

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    const response = await fetch(`/api/admin/testimonials?status=${status}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { testimonials?: TestimonialItem[] } | null;
    setItems(data?.testimonials ?? []);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void fetchItems(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchItems]);

  function edit(item: TestimonialItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      location: item.location ?? '',
      rating: item.rating,
      title: item.title ?? '',
      message: item.message,
      proof_image_url: item.proof_image_url ?? '',
      proof_alt: item.proof_alt ?? '',
      source_url: item.source_url ?? '',
      status: item.status,
      is_active: item.is_active,
      show_on_homepage: item.show_on_homepage,
      sort_order: item.sort_order,
    });
  }

  async function save() {
    setSaving(true);
    setError('');
    const response = await fetch(editingId ? `/api/admin/testimonials/${editingId}` : '/api/admin/testimonials', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => null) as { error?: string } | null;
    setSaving(false);
    if (!response.ok) {
      setError(data?.error ?? 'Failed to save testimonial');
      return;
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    void fetchItems();
  }

  async function uploadProof(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError('');
    const body = new FormData();
    body.append('files', file);
    body.append('folder', 'testimonials');
    const response = await fetch('/api/admin/upload', { method: 'POST', body });
    const data = await response.json().catch(() => null) as { urls?: string[]; error?: string } | null;
    setUploading(false);
    if (!response.ok || !data?.urls?.[0]) {
      setError(data?.error ?? 'Proof upload failed');
      return;
    }
    setForm((current) => ({ ...current, proof_image_url: data.urls?.[0] ?? '' }));
  }

  async function updateTestimonial(id: string, update: Record<string, unknown>) {
    await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    void fetchItems();
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
    void fetchItems();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.4fr]">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</h1>
        <p className="mt-1 text-sm text-gray-500">Manage customer reviews, proof archives, and homepage placement.</p>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Customer name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Location" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Short badge/title" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Slug (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Testimonial message" rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input value={form.proof_image_url} onChange={(event) => setForm({ ...form, proof_image_url: event.target.value })} placeholder="Proof image URL or /legacy path" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => void uploadProof(event.target.files?.[0])} />
            </label>
          </div>
          <input value={form.proof_alt} onChange={(event) => setForm({ ...form, proof_alt: event.target.value })} placeholder="Proof image alt text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.source_url} onChange={(event) => setForm({ ...form, source_url: event.target.value })} placeholder="Source URL (admin reference only)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />

          <div className="grid gap-3 sm:grid-cols-3">
            <input type="number" min={1} max={5} value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) || 5 })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Active</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.show_on_homepage} onChange={(event) => setForm({ ...form, show_on_homepage: event.target.checked })} /> Show on homepage</label>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save
            </button>
            {editingId && <button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Testimonials</h2>
            <p className="mt-1 text-sm text-gray-500">{items.length} testimonial records.</p>
          </div>
          <select value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">No testimonials found.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${item.is_active ? '' : 'opacity-60'}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">{item.status}</span>
                      {item.show_on_homepage && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Homepage</span>}
                      {!item.is_active && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">Inactive</span>}
                    </div>
                    <div className="mt-2 flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_unused, index) => <Star key={index} className="h-4 w-4" fill={index < item.rating ? 'currentColor' : 'none'} />)}
                    </div>
                    {item.title && <h3 className="mt-3 font-semibold text-gray-900">{item.title}</h3>}
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{item.message}</p>
                    <p className="mt-3 text-xs text-gray-400">{item.location || 'No location'} · order {item.sort_order}</p>
                    {item.proof_image_url && <a href={item.proof_image_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"><Eye className="h-3.5 w-3.5" /> View proof</a>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateTestimonial(item.id, { status: 'approved', is_active: true })} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white"><CheckCircle2 className="h-3.5 w-3.5" />Publish</button>
                    <button onClick={() => updateTestimonial(item.id, { show_on_homepage: !item.show_on_homepage, status: 'approved', is_active: true })} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"><Star className="h-3.5 w-3.5" />{item.show_on_homepage ? 'Remove home' : 'Homepage'}</button>
                    <button onClick={() => edit(item)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deactivate(item.id)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}