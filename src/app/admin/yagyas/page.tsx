'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Flame, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface Yagya {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: number | string;
  short_desc: string | null;
  description: string | null;
  benefits: string[] | null;
  images: string[] | null;
  thumbnail_url: string | null;
  planet: string | null;
  service_duration: string | null;
  service_delivery_mode: string | null;
  display_order: number;
  is_active: boolean;
}

interface FormState {
  sku: string;
  name: string;
  slug: string;
  price: string;
  planet: string;
  short_desc: string;
  description: string;
  benefits: string;
  service_duration: string;
  service_delivery_mode: string;
  display_order: string;
  is_active: boolean;
  image_url: string;
}

function emptyForm(): FormState {
  return {
    sku: '',
    name: '',
    slug: '',
    price: '',
    planet: '',
    short_desc: '',
    description: '',
    benefits: '',
    service_duration: 'Performed on an auspicious muhurat',
    service_delivery_mode: 'Performed by our pandits on your behalf (remote)',
    display_order: '0',
    is_active: true,
    image_url: '',
  };
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function toForm(y: Yagya): FormState {
  return {
    sku: y.sku,
    name: y.name,
    slug: y.slug,
    price: String(y.price ?? ''),
    planet: y.planet ?? '',
    short_desc: y.short_desc ?? '',
    description: y.description ?? '',
    benefits: (y.benefits ?? []).join('\n'),
    service_duration: y.service_duration ?? '',
    service_delivery_mode: y.service_delivery_mode ?? '',
    display_order: String(y.display_order ?? 0),
    is_active: y.is_active,
    image_url: y.thumbnail_url ?? (y.images?.[0] ?? ''),
  };
}

export default function AdminYagyasPage() {
  const [yagyas, setYagyas] = useState<Yagya[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/yagyas');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setYagyas(data.yagyas ?? []);
    } catch {
      toast.error('Failed to load yagyas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (y: Yagya) => {
    setEditingId(y.id);
    setForm(toForm(y));
    setShowForm(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('files', file);
    formData.append('folder', 'yagyas');
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.urls?.[0]) throw new Error(data.error ?? 'Upload failed');
      setForm((prev) => ({ ...prev, image_url: data.urls[0] }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.sku.trim() || !form.price.trim()) {
      toast.error('Name, slug, SKU and price are required');
      return;
    }
    setSaving(true);
    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      slug: form.slug.trim(),
      price: Number(form.price),
      planet: form.planet.trim() || null,
      short_desc: form.short_desc.trim() || null,
      description: form.description.trim() || null,
      benefits: form.benefits.split('\n').map((b) => b.trim()).filter(Boolean),
      service_duration: form.service_duration.trim() || null,
      service_delivery_mode: form.service_delivery_mode.trim() || null,
      display_order: Number(form.display_order) || 0,
      is_active: form.is_active,
      images: form.image_url ? [form.image_url] : [],
      thumbnail_url: form.image_url || null,
    };
    try {
      const url = editingId ? `/api/admin/yagyas/${editingId}` : '/api/admin/yagyas';
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      toast.success(editingId ? 'Yagya updated' : 'Yagya created');
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (y: Yagya) => {
    if (!window.confirm(`Archive "${y.name}"? It will be hidden from the storefront.`)) return;
    try {
      const res = await fetch(`/api/admin/yagyas/${y.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Yagya archived');
      await load();
    } catch {
      toast.error('Failed to archive yagya');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Flame className="h-6 w-6 text-amber-600" /> Vedic Yagyas
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage Yagya pricing, descriptions, images and visibility.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" /> New Yagya
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Yagya</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {yagyas.map((y) => (
                <tr key={y.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-amber-50">
                        {(y.thumbnail_url || y.images?.[0]) ? (
                          <Image src={(y.thumbnail_url || y.images?.[0]) as string} alt="" fill className="object-contain p-1" sizes="40px" />
                        ) : (
                          <Flame className="absolute inset-0 m-auto h-5 w-5 text-amber-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{y.name}</p>
                        <p className="text-xs text-gray-500">{y.short_desc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{y.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">₹{Number(y.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-gray-600">{y.display_order}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${y.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {y.is_active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => openEdit(y)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-amber-600" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(y)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600" title="Archive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {yagyas.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No yagyas yet. Click “New Yagya” to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Yagya' : 'New Yagya'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Name *</span>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((p) => ({ ...p, name, slug: editingId ? p.slug : slugify(name) }));
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Slug *</span>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">SKU *</span>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Price (₹) *</span>
                  <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Planet / Deity</span>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.planet} onChange={(e) => setForm((p) => ({ ...p, planet: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Display order</span>
                  <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))} />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Short description (card subtitle)</span>
                <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.short_desc} onChange={(e) => setForm((p) => ({ ...p, short_desc: e.target.value }))} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Full description (HTML allowed)</span>
                <textarea rows={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Benefits (one per line)</span>
                <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.benefits} onChange={(e) => setForm((p) => ({ ...p, benefits: e.target.value }))} />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Muhurat / duration</span>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.service_duration} onChange={(e) => setForm((p) => ({ ...p, service_duration: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Delivery mode</span>
                  <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.service_delivery_mode} onChange={(e) => setForm((p) => ({ ...p, service_delivery_mode: e.target.value }))} />
                </label>
              </div>

              <div>
                <span className="mb-1 block text-sm font-medium text-gray-700">Card image</span>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-amber-50">
                    {form.image_url ? (
                      <Image src={form.image_url} alt="" fill className="object-contain p-1" sizes="80px" />
                    ) : (
                      <Flame className="absolute inset-0 m-auto h-6 w-6 text-amber-300" />
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'Uploading…' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-700">Active (visible on storefront)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Save changes' : 'Create yagya'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
