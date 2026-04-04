'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, IndianRupee } from 'lucide-react';

interface MetalRow {
  id: string;
  name: string;
  slug: string;
  purity: string | null;
  price_per_gram: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM: Partial<MetalRow> = {
  name: '',
  slug: '',
  purity: '',
  price_per_gram: 0,
  description: '',
  sort_order: 0,
};

export default function AdminMetalsPage() {
  const [metals, setMetals] = useState<MetalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MetalRow>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Quick-edit price inline
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');

  const fetchMetals = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/metals');
    if (res.ok) {
      const data = await res.json();
      setMetals(data.metals);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMetals(); }, [fetchMetals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const url = editing
      ? `/api/admin/metals/${editing}`
      : '/api/admin/metals';
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
      fetchMetals();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleEdit = (metal: MetalRow) => {
    setEditing(metal.id);
    setForm({
      name: metal.name,
      slug: metal.slug,
      purity: metal.purity ?? '',
      price_per_gram: metal.price_per_gram,
      description: metal.description ?? '',
      sort_order: metal.sort_order,
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this metal? It can be re-enabled later.')) return;
    const res = await fetch(`/api/admin/metals/${id}`, { method: 'DELETE' });
    if (res.ok) fetchMetals();
  };

  const handleToggleActive = async (metal: MetalRow) => {
    await fetch(`/api/admin/metals/${metal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !metal.is_active }),
    });
    fetchMetals();
  };

  const handleQuickPriceSave = async (metalId: string) => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) return;
    await fetch(`/api/admin/metals/${metalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_per_gram: price }),
    });
    setEditingPrice(null);
    setPriceInput('');
    fetchMetals();
  };

  const nameToSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metals & Pricing</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage metals and their current prices. These prices are used in the gem configurator.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_FORM); setError(''); }}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Add Metal
        </button>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metals.filter(m => m.is_active).map((m) => (
          <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">{m.name}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">₹{m.price_per_gram.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-gray-400">per gram · {m.purity ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Metal' : 'Add New Metal'}
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
                    placeholder="Gold 22K"
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
                    placeholder="gold_22k"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Purity</label>
                  <input
                    type="text"
                    value={form.purity ?? ''}
                    onChange={(e) => setForm(f => ({ ...f, purity: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="91.6%, 925, etc."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Price per gram (₹) *</label>
                  <input
                    type="number"
                    value={form.price_per_gram ?? 0}
                    onChange={(e) => setForm(f => ({ ...f, price_per_gram: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    min={0}
                    step={0.01}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">Description</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  rows={2}
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
                  {saving ? 'Saving...' : editing ? 'Update Metal' : 'Create Metal'}
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
              <th className="p-3 font-medium text-gray-600">#</th>
              <th className="p-3 font-medium text-gray-600">Metal</th>
              <th className="p-3 font-medium text-gray-600">Purity</th>
              <th className="p-3 font-medium text-gray-600">Price/g (₹)</th>
              <th className="p-3 font-medium text-gray-600">Last Updated</th>
              <th className="p-3 font-medium text-gray-600">Status</th>
              <th className="p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : metals.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No metals found.</td></tr>
            ) : metals.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                <td className="p-3 text-gray-400">{m.sort_order}</td>
                <td className="p-3">
                  <p className="font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs font-mono text-gray-400">{m.slug}</p>
                </td>
                <td className="p-3 text-gray-600">{m.purity ?? '—'}</td>
                <td className="p-3">
                  {editingPrice === m.id ? (
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="number"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        className="w-24 rounded border border-amber-400 px-2 py-1 text-sm font-medium outline-none focus:ring-1 focus:ring-amber-500"
                        min={0}
                        step={0.01}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuickPriceSave(m.id);
                          if (e.key === 'Escape') { setEditingPrice(null); setPriceInput(''); }
                        }}
                      />
                      <button
                        onClick={() => handleQuickPriceSave(m.id)}
                        className="rounded p-1 text-green-600 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setEditingPrice(null); setPriceInput(''); }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingPrice(m.id); setPriceInput(String(m.price_per_gram)); }}
                      className="group flex items-center gap-1 font-bold text-gray-900 hover:text-amber-600"
                      title="Click to edit price"
                    >
                      ₹{m.price_per_gram.toLocaleString('en-IN')}
                      <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  )}
                </td>
                <td className="p-3 text-xs text-gray-500">{formatDate(m.updated_at)}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggleActive(m)}
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold cursor-pointer transition-colors ${
                      m.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {m.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(m)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
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
