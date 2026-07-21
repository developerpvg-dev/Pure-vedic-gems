'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageShell';

interface HeroSlideItem {
  id: string;
  slug: string;
  desktop_image_url: string;
  mobile_image_url: string;
  alt_text: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM = {
  slug: '',
  desktop_image_url: '',
  mobile_image_url: '',
  alt_text: '',
  link_url: '',
  sort_order: 0,
  is_active: true,
};

function ImageUploadField({
  label,
  value,
  onChange,
  helper,
  uploading,
  onUploadStart,
  onUploadEnd,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  uploading: boolean;
  onUploadStart: () => void;
  onUploadEnd: () => void;
}) {
  async function handleFile(file: File | undefined) {
    if (!file) return;
    onUploadStart();
    const body = new FormData();
    body.append('files', file);
    body.append('folder', 'hero-slides');
    const response = await fetch('/api/admin/upload', { method: 'POST', body });
    const data = await response.json().catch(() => null) as { urls?: string[]; error?: string } | null;
    onUploadEnd();
    if (response.ok && data?.urls?.[0]) {
      onChange(data.urls[0]);
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</label>
      {helper ? <p className="mt-0.5 text-xs text-gray-400">{helper}</p> : null}
      {value ? (
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <div className="relative h-20 w-32 overflow-hidden rounded-md border border-gray-200 bg-white">
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-amber-500"
            />
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Upload className="h-3 w-3" />
                Replace
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />
              </label>
              <button type="button" onClick={() => onChange('')} className="text-xs font-medium text-red-600 hover:underline">
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-amber-400 hover:bg-amber-50/40">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Or paste image URL (/home/hero/... or Supabase URL)"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      )}
    </div>
  );
}

export default function AdminHeroSlidesPage() {
  const [items, setItems] = useState<HeroSlideItem[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/hero-slides', { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { slides?: HeroSlideItem[] } | null;
    setItems(data?.slides ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void fetchItems());
  }, [fetchItems]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      sort_order: (items[items.length - 1]?.sort_order ?? 0) + 10,
    });
    setShowForm(true);
    setError('');
  }

  function openEdit(item: HeroSlideItem) {
    setEditingId(item.id);
    setForm({
      slug: item.slug,
      desktop_image_url: item.desktop_image_url,
      mobile_image_url: item.mobile_image_url,
      alt_text: item.alt_text,
      link_url: item.link_url ?? '',
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setShowForm(true);
    setError('');
  }

  async function save() {
    if (!form.desktop_image_url || !form.mobile_image_url || !form.alt_text.trim()) {
      setError('Desktop image, mobile image, and alt text are required.');
      return;
    }

    setSaving(true);
    setError('');
    const response = await fetch(
      editingId ? `/api/admin/hero-slides/${editingId}` : '/api/admin/hero-slides',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      },
    );
    const data = await response.json().catch(() => null) as { error?: string } | null;
    setSaving(false);

    if (!response.ok) {
      setError(data?.error ?? 'Failed to save hero slide');
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    void fetchItems();
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this hero slide?')) return;
    const response = await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Failed to delete slide');
      return;
    }
    void fetchItems();
  }

  async function toggleActive(item: HeroSlideItem) {
    const response = await fetch(`/api/admin/hero-slides/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    if (response.ok) void fetchItems();
  }

  async function moveSlide(item: HeroSlideItem, direction: -1 | 1) {
    const index = items.findIndex((row) => row.id === item.id);
    const swapWith = items[index + direction];
    if (!swapWith) return;

    await Promise.all([
      fetch(`/api/admin/hero-slides/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: swapWith.sort_order }),
      }),
      fetch(`/api/admin/hero-slides/${swapWith.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: item.sort_order }),
      }),
    ]);

    void fetchItems();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Homepage Hero"
        description="Manage the homepage hero carousel. Upload separate desktop (≥768px) and mobile images. Use WebP for fastest loading."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {items.filter((item) => item.is_active).length} active slide{items.length === 1 ? '' : 's'} · changes appear on the homepage within seconds
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Add slide
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {showForm ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit slide' : 'New slide'}</h2>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <ImageUploadField
              label="Desktop image (tablet & desktop)"
              value={form.desktop_image_url}
              onChange={(value) => setForm((current) => ({ ...current, desktop_image_url: value }))}
              helper="Recommended: wide WebP, ~1672×941 or similar landscape ratio."
              uploading={uploading}
              onUploadStart={() => setUploading(true)}
              onUploadEnd={() => setUploading(false)}
            />
            <ImageUploadField
              label="Mobile image (phones)"
              value={form.mobile_image_url}
              onChange={(value) => setForm((current) => ({ ...current, mobile_image_url: value }))}
              helper="Recommended: portrait WebP for phones."
              uploading={uploading}
              onUploadStart={() => setUploading(true)}
              onUploadEnd={() => setUploading(false)}
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Alt text</label>
              <input
                value={form.alt_text}
                onChange={(event) => setForm((current) => ({ ...current, alt_text: event.target.value }))}
                placeholder="Describe the slide for accessibility"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Click link (optional)
              </label>
              <input
                value={form.link_url}
                onChange={(event) => setForm((current) => ({ ...current, link_url: event.target.value }))}
                placeholder="/shop/rudraksha or https://…"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Slug (optional)</label>
              <input
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="hero-slide-summer-sale"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Sort order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Show on homepage
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Save changes' : 'Create slide'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
                setError('');
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading slides…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No hero slides yet. Add your first slide to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex gap-2">
                  <div className="relative h-20 w-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img src={item.desktop_image_url} alt="" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Desktop</span>
                  </div>
                  <div className="relative h-20 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img src={item.mobile_image_url} alt="" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Mobile</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{item.alt_text}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.is_active ? 'Active' : 'Hidden'}
                    </span>
                    <span className="text-xs text-gray-400">Order {item.sort_order}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">{item.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void moveSlide(item, -1)} disabled={index === 0} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => void moveSlide(item, 1)} disabled={index === items.length - 1} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => openEdit(item)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button type="button" onClick={() => void toggleActive(item)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    {item.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {item.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" onClick={() => void remove(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
