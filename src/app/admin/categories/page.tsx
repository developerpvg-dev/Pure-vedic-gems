'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Check, GripVertical, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface GemCategoryRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  sanskrit_name: string | null;
  planet: string | null;
  emoji: string | null;
  color: string | null;
  image_url: string | null;
  hover_image_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM: Partial<GemCategoryRow> = {
  name: '',
  slug: '',
  type: 'navaratna',
  sanskrit_name: '',
  planet: '',
  image_url: '',
  hover_image_url: '',
  description: '',
  sort_order: 0,
};

function CategoryImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = data.urls?.[0] ?? data.url;
      if (url) onUploaded(url);
    } catch {
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={uploading}
      onClick={() => inputRef.current?.click()}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 transition hover:border-amber-400 hover:text-amber-600 disabled:opacity-50"
    >
      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {uploading ? 'Uploading…' : 'Upload Image'}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </button>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<GemCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<GemCategoryRow>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'navaratna' | 'upratna'>('all');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const url = editing
      ? `/api/admin/categories/${editing}`
      : '/api/admin/categories';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      fetchCategories();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleEdit = (cat: GemCategoryRow) => {
    setEditing(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      type: cat.type,
      sanskrit_name: cat.sanskrit_name ?? '',
      planet: cat.planet ?? '',
      image_url: cat.image_url ?? '',
      hover_image_url: cat.hover_image_url ?? '',
      description: cat.description ?? '',
      sort_order: cat.sort_order,
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this category? It can be re-enabled later.')) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (res.ok) fetchCategories();
  };

  const handleToggleActive = async (cat: GemCategoryRow) => {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !cat.is_active }),
    });
    fetchCategories();
  };

  const filtered = filterType === 'all'
    ? categories
    : categories.filter(c => c.type === filterType);

  const nameToSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gem Categories</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage Navaratna (9 sacred) and Upratna (semi-precious) gem categories.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_FORM); setError(''); }}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Type Filter */}
      <div className="mt-6 flex gap-2">
        {(['all', 'navaratna', 'upratna'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterType === t
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'all' ? 'All' : t === 'navaratna' ? 'Navaratna' : 'Upratna'}
            <span className="ml-1.5 text-xs opacity-70">
              ({t === 'all' ? categories.length : categories.filter(c => c.type === t).length})
            </span>
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Name *</label>
                  <input
                    type="text"
                    value={form.name ?? ''}
                    onChange={(e) => setForm(f => ({
                      ...f,
                      name: e.target.value,
                      ...(!editing ? { slug: nameToSlug(e.target.value) } : {}),
                    }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Slug *</label>
                  <input
                    type="text"
                    value={form.slug ?? ''}
                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Type *</label>
                  <select
                    value={form.type ?? 'navaratna'}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="navaratna">Navaratna</option>
                    <option value="upratna">Upratna</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Sanskrit Name</label>
                  <input
                    type="text"
                    value={form.sanskrit_name ?? ''}
                    onChange={(e) => setForm(f => ({ ...f, sanskrit_name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="Manik, Pukhraj..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">Planet</label>
                <input
                  type="text"
                  value={form.planet ?? ''}
                  onChange={(e) => setForm(f => ({ ...f, planet: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Sun, Moon..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">Main Image</label>
                {form.image_url ? (
                  <div className="mt-1 flex items-center gap-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                      <Image src={form.image_url} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <CategoryImageUpload onUploaded={(url) => setForm(f => ({ ...f, image_url: url }))} />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">Hover Image <span className="font-normal text-gray-400">(appears on card hover)</span></label>
                {form.hover_image_url ? (
                  <div className="mt-1 flex items-center gap-3">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                      <Image src={form.hover_image_url} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, hover_image_url: '' }))}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <CategoryImageUpload onUploaded={(url) => setForm(f => ({ ...f, hover_image_url: url }))} />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">Description</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  rows={2}
                  placeholder="Vedic description for the shop page header..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order ?? 0}
                  onChange={(e) => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="mt-1 w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  min={0}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="p-3 font-medium text-gray-600 w-8"><GripVertical className="h-3.5 w-3.5 text-gray-300" /></th>
              <th className="p-3 font-medium text-gray-600">Category</th>
              <th className="p-3 font-medium text-gray-600">Type</th>
              <th className="p-3 font-medium text-gray-600">Planet</th>
              <th className="p-3 font-medium text-gray-600">Sanskrit</th>
              <th className="p-3 font-medium text-gray-600">Status</th>
              <th className="p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No categories found.</td></tr>
            ) : filtered.map((cat) => (
              <tr key={cat.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                <td className="p-3 text-center text-gray-400">{cat.sort_order}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    {cat.image_url && (
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-gray-200">
                        <Image src={cat.image_url} alt="" fill className="object-cover" sizes="32px" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs font-mono text-gray-400">{cat.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    cat.type === 'navaratna'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {cat.type}
                  </span>
                </td>
                <td className="p-3 text-gray-600">{cat.planet ?? '—'}</td>
                <td className="p-3 text-gray-600">{cat.sanskrit_name ?? '—'}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold cursor-pointer transition-colors ${
                      cat.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {cat.is_active ? (
                      <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Active</span>
                    ) : 'Inactive'}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                      title="Deactivate"
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
    </div>
  );
}
