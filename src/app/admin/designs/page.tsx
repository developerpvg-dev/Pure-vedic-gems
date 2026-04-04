'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface JewelryDesign {
  id: string;
  name: string;
  setting_type: string;
  image_url: string | null;
  description: string | null;
  making_charges: Record<string, number>;
  estimated_metal_weight: Record<string, number> | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const SETTING_TYPES = ['ring', 'pendant', 'bracelet'] as const;

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<JewelryDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JewelryDesign | null>(null);

  const fetchDesigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?setting_type=${filter}` : '';
      const res = await fetch(`/api/admin/designs${params}`);
      const data = await res.json();
      setDesigns(data.designs ?? []);
    } catch {
      toast.error('Failed to load designs');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchDesigns(); }, [fetchDesigns]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this design?')) return;
    try {
      const res = await fetch(`/api/admin/designs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Design removed');
      fetchDesigns();
    } catch {
      toast.error('Failed to remove design');
    }
  };

  const handleEdit = (design: JewelryDesign) => {
    setEditing(design);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchDesigns();
  };

  const filtered = designs.filter(d => d.is_active);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Setting Types & Designs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage jewelry designs for each setting type (Ring, Pendant, Bracelet).
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Add Design
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2">
        {['all', ...SETTING_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              filter === t ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'all' ? 'All Types' : t}
          </button>
        ))}
      </div>

      {/* Design Form Modal */}
      {showForm && (
        <DesignForm
          design={editing}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Designs Grid */}
      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 text-center text-gray-500">
          <p className="text-lg font-medium">No designs yet</p>
          <p className="mt-1 text-sm">Add your first jewelry design to get started.</p>
        </div>
      ) : (
        <>
          {SETTING_TYPES.map((type) => {
            const typeDesigns = filtered.filter((d) => d.setting_type === type);
            if (typeDesigns.length === 0 && filter !== 'all' && filter !== type) return null;
            if (typeDesigns.length === 0) return null;

            return (
              <div key={type} className="mt-8">
                <h2 className="mb-4 text-lg font-semibold capitalize text-gray-900">
                  {type} Designs
                  <span className="ml-2 text-sm font-normal text-gray-400">({typeDesigns.length})</span>
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {typeDesigns.map((design) => (
                    <div
                      key={design.id}
                      className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] bg-gray-50">
                        {design.image_url ? (
                          <Image
                            src={design.image_url}
                            alt={design.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300">
                            <span className="text-4xl">
                              {type === 'ring' ? '💍' : type === 'pendant' ? '📿' : '⌚'}
                            </span>
                          </div>
                        )}

                        {/* Actions overlay */}
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleEdit(design)}
                            className="rounded-lg bg-white p-1.5 shadow-md transition hover:bg-gray-50"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(design.id)}
                            className="rounded-lg bg-white p-1.5 shadow-md transition hover:bg-red-50"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900">{design.name}</h3>
                        {design.description && (
                          <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{design.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <span className="rounded bg-gray-100 px-2 py-0.5 capitalize">{design.setting_type}</span>
                          <span>Order: {design.sort_order}</span>
                        </div>
                        {design.making_charges && Object.keys(design.making_charges).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            Making charges:{' '}
                            {Object.entries(design.making_charges).map(([metal, charge]) => (
                              <span key={metal} className="mr-2">
                                {metal.replace(/_/g, ' ')}: ₹{Number(charge).toLocaleString('en-IN')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── Design Form Component ──────────────────────────────────────────────────

function DesignForm({
  design,
  onClose,
  onSuccess,
}: {
  design: JewelryDesign | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(design?.name ?? '');
  const [settingType, setSettingType] = useState(design?.setting_type ?? 'ring');
  const [description, setDescription] = useState(design?.description ?? '');
  const [imageUrl, setImageUrl] = useState(design?.image_url ?? '');
  const [sortOrder, setSortOrder] = useState(design?.sort_order ?? 0);
  const [makingCharges, setMakingCharges] = useState<Record<string, string>>(
    design?.making_charges
      ? Object.fromEntries(Object.entries(design.making_charges).map(([k, v]) => [k, String(v)]))
      : { gold_22k: '', gold_18k: '', silver_925: '', panchdhatu: '' }
  );
  const [metalWeights, setMetalWeights] = useState<Record<string, string>>(
    design?.estimated_metal_weight
      ? Object.fromEntries(Object.entries(design.estimated_metal_weight).map(([k, v]) => [k, String(v)]))
      : { default: '' }
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const safeName = `design_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('jewelry-designs')
        .upload(safeName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('jewelry-designs')
        .getPublicUrl(safeName);

      setImageUrl(publicUrl);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Design name is required');
      return;
    }

    setSaving(true);
    try {
      const charges: Record<string, number> = {};
      for (const [k, v] of Object.entries(makingCharges)) {
        const num = parseFloat(v);
        if (!isNaN(num) && num > 0) charges[k] = num;
      }

      const weights: Record<string, number> = {};
      for (const [k, v] of Object.entries(metalWeights)) {
        const num = parseFloat(v);
        if (!isNaN(num) && num > 0) weights[k] = num;
      }

      const body = {
        ...(design ? { id: design.id } : {}),
        name: name.trim(),
        setting_type: settingType,
        description: description.trim() || null,
        image_url: imageUrl || null,
        making_charges: charges,
        estimated_metal_weight: Object.keys(weights).length > 0 ? weights : null,
        sort_order: sortOrder,
      };

      const res = await fetch('/api/admin/designs', {
        method: design ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(design ? 'Design updated' : 'Design created');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900">
          {design ? 'Edit Design' : 'Add New Design'}
        </h2>

        <div className="mt-6 space-y-4">
          {/* Setting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Setting Type</label>
            <select
              value={settingType}
              onChange={(e) => setSettingType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {SETTING_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Design Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Classic Solitaire Ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Brief description of this design..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Design Image</label>
            <div className="mt-1 flex items-center gap-3">
              {imageUrl ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute right-0.5 top-0.5 rounded-full bg-white p-0.5 shadow"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition hover:border-amber-400"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <Upload className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              <p className="text-xs text-gray-400">JPG, PNG, WebP. Max 10MB.</p>
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="mt-1 w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Making Charges */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Making Charges (₹)</label>
            <p className="text-xs text-gray-400 mb-2">Set charges per metal type</p>
            <div className="grid grid-cols-2 gap-2">
              {['gold_22k', 'gold_18k', 'silver_925', 'panchdhatu', 'platinum'].map((metal) => (
                <div key={metal} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-gray-500 capitalize">{metal.replace(/_/g, ' ')}</span>
                  <input
                    type="number"
                    value={makingCharges[metal] ?? ''}
                    onChange={(e) => setMakingCharges((prev) => ({ ...prev, [metal]: e.target.value }))}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Metal Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Estimated Metal Weight (grams)</label>
            <input
              type="number"
              step="0.1"
              value={metalWeights['default'] ?? ''}
              onChange={(e) => setMetalWeights({ default: e.target.value })}
              className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. 4.5"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {design ? 'Update Design' : 'Create Design'}
          </button>
        </div>
      </div>
    </div>
  );
}
