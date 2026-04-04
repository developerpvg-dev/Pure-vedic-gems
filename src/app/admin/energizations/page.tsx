'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Sparkles, X } from 'lucide-react';

interface Energization {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: string | null;
  includes: string[] | null;
  includes_video: boolean;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  price: 0,
  duration: '',
  includes: '',
  includes_video: false,
  sort_order: 0,
};

export default function EnergizationsPage() {
  const [items, setItems] = useState<Energization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/energizations');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setItems(json.energizations ?? []);
    } catch {
      setError('Failed to load energization options');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (item: Energization) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      duration: item.duration ?? '',
      includes: Array.isArray(item.includes) ? item.includes.join('\n') : '',
      includes_video: item.includes_video,
      sort_order: item.sort_order,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');

    const includesArr = form.includes.split('\n').map(s => s.trim()).filter(Boolean);

    try {
      const url = editingId ? `/api/admin/energizations/${editingId}` : '/api/admin/energizations';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          includes: includesArr.length > 0 ? includesArr : null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to save');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"? This will hide it from the configurator.`)) return;
    try {
      await fetch(`/api/admin/energizations/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch {
      setError('Failed to deactivate');
    }
  };

  const toggleActive = async (item: Energization) => {
    try {
      await fetch(`/api/admin/energizations/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      fetchItems();
    } catch {
      setError('Failed to update status');
    }
  };

  const activeCount = items.filter(i => i.is_active).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Energization / Pooja Options</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage pooja and energization options. {activeCount} active. Prices add to the final configuration price.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Add Energization
        </button>
      </div>

      {error && !showModal && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">No energization options yet</p>
          <button onClick={openCreate} className="mt-3 text-sm font-semibold text-amber-600 hover:underline">
            Add your first option
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Price</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Duration</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Video</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className={!item.is_active ? 'bg-gray-50 opacity-60' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">
                    {item.price > 0 ? `₹${item.price.toLocaleString('en-IN')}` : 'Free'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.duration || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {item.includes_video ? (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">YES</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        item.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-amber-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Energization' : 'Add Energization'}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Special Energisation with Pictures"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Describe what this energization includes..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Price (₹)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    min={0}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">0 = Free / complimentary</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Duration</label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 2 hours"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Includes (one per line)</label>
                <textarea
                  value={form.includes}
                  onChange={(e) => setForm({ ...form, includes: e.target.value })}
                  rows={3}
                  placeholder={'Vedic mantra chanting\nPurification ritual\nEnergization certificate'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.includes_video}
                    onChange={(e) => setForm({ ...form, includes_video: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Includes video recording
                </label>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-amber-600 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
