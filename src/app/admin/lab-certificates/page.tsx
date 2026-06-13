'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileBadge2, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';

interface LabCertificate {
  id: string;
  name: string;
  slug: string;
  lab_name: string | null;
  certificate_url: string;
  thumbnail_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  lab_name: '',
  certificate_url: '',
  thumbnail_url: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminLabCertificatesPage() {
  const [items, setItems] = useState<LabCertificate[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/lab-certificates', { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { certificates?: LabCertificate[] } | null;
    setItems(data?.certificates ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void fetchItems(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchItems]);

  function edit(item: LabCertificate) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      lab_name: item.lab_name ?? '',
      certificate_url: item.certificate_url,
      thumbnail_url: item.thumbnail_url ?? '',
      description: item.description ?? '',
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
  }

  async function save() {
    setSaving(true);
    setError('');
    const response = await fetch(editingId ? `/api/admin/lab-certificates/${editingId}` : '/api/admin/lab-certificates', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => null) as { error?: string } | null;
    setSaving(false);
    if (!response.ok) {
      setError(data?.error ?? 'Failed to save certificate');
      return;
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    void fetchItems();
  }

  async function uploadCertificate(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError('');
    const body = new FormData();
    body.append('file', file);
    const response = await fetch('/api/admin/certificate-upload', { method: 'POST', body });
    const data = await response.json().catch(() => null) as { url?: string; error?: string } | null;
    setUploading(false);
    if (!response.ok || !data?.url) {
      setError(data?.error ?? 'Upload failed');
      return;
    }
    const uploadedUrl = data.url;
    setForm((current) => ({ ...current, certificate_url: uploadedUrl, thumbnail_url: uploadedUrl }));
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/lab-certificates/${id}`, { method: 'DELETE' });
    void fetchItems();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.4fr]">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Lab Certificate' : 'Add Lab Certificate'}</h1>
        <p className="mt-1 text-sm text-gray-500">Upload sample certificate files and publish them on the public certificate page.</p>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="mt-5 space-y-4">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Certificate name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.lab_name} onChange={(event) => setForm({ ...form, lab_name: event.target.value })} placeholder="Lab name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Slug (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input value={form.certificate_url} onChange={(event) => setForm({ ...form, certificate_url: event.target.value })} placeholder="Certificate file URL" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(event) => void uploadCertificate(event.target.files?.[0])} />
            </label>
          </div>
          <input value={form.thumbnail_url} onChange={(event) => setForm({ ...form, thumbnail_url: event.target.value })} placeholder="Thumbnail URL" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 0 })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Active</label>
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
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Published certificate records</h2>
          <p className="mt-1 text-sm text-gray-500">{items.length} certificate entries.</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">No certificates found.</div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <article key={item.id} className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${item.is_active ? '' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileBadge2 className="h-4 w-4 text-amber-600" />
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{item.lab_name || 'No lab label'} · order {item.sort_order}</p>
                    <a href={item.certificate_url} target="_blank" rel="noreferrer" className="mt-2 inline-block max-w-full truncate text-xs font-medium text-amber-700 hover:underline">{item.certificate_url}</a>
                  </div>
                  <div className="flex gap-1">
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
