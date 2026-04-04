'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Award, X } from 'lucide-react';

interface Certification {
  id: string;
  name: string;
  full_name: string | null;
  extra_charge: number;
  turnaround_days: number | null;
  sample_cert_url: string | null;
  description: string | null;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM = {
  name: '',
  full_name: '',
  extra_charge: 0,
  turnaround_days: 7,
  sample_cert_url: '',
  description: '',
  is_default: false,
  sort_order: 0,
};

export default function CertificationsPage() {
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/certifications');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setItems(json.certifications ?? []);
    } catch {
      setError('Failed to load certifications');
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

  const openEdit = (item: Certification) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      full_name: item.full_name ?? '',
      extra_charge: item.extra_charge,
      turnaround_days: item.turnaround_days ?? 7,
      sample_cert_url: item.sample_cert_url ?? '',
      description: item.description ?? '',
      is_default: item.is_default,
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
    try {
      const url = editingId ? `/api/admin/certifications/${editingId}` : '/api/admin/certifications';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      await fetch(`/api/admin/certifications/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch {
      setError('Failed to deactivate');
    }
  };

  const toggleActive = async (item: Certification) => {
    try {
      await fetch(`/api/admin/certifications/${item.id}`, {
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
          <h1 className="text-2xl font-bold text-gray-900">Certification Labs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage certification labs available in the configurator. {activeCount} active.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Add Certification
        </button>
      </div>

      {error && !showModal && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Award className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">No certifications yet</p>
          <button onClick={openCreate} className="mt-3 text-sm font-semibold text-amber-600 hover:underline">
            Add your first certification
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Full Name</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Extra Charge</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Days</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className={!item.is_active ? 'bg-gray-50 opacity-60' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.name}
                    {item.is_default && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">DEFAULT</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.full_name || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">
                    {item.extra_charge > 0 ? `₹${item.extra_charge.toLocaleString('en-IN')}` : 'Free'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.turnaround_days ?? '—'}</td>
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
                {editingId ? 'Edit Certification' : 'Add Certification'}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Short Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. GIA"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Full Name</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Gemological Institute of America"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Extra Charge (₹)</label>
                  <input
                    type="number"
                    value={form.extra_charge}
                    onChange={(e) => setForm({ ...form, extra_charge: parseFloat(e.target.value) || 0 })}
                    min={0}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Turnaround (days)</label>
                  <input
                    type="number"
                    value={form.turnaround_days}
                    onChange={(e) => setForm({ ...form, turnaround_days: parseInt(e.target.value) || 7 })}
                    min={1}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Sample Certificate URL</label>
                <input
                  value={form.sample_cert_url}
                  onChange={(e) => setForm({ ...form, sample_cert_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Default certification
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
