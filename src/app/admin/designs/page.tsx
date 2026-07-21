'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Gem,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import DesignForm, { type AdminJewelryDesign } from '@/components/admin/jewelry-designs/DesignForm';
import JewelryMetalCatalogPanel from '@/components/admin/jewelry-designs/JewelryMetalCatalogPanel';
import {
  JEWELRY_DESIGN_SETTING_TYPES,
  RUDRAKSHA_MOUNTING_CATEGORIES,
} from '@/lib/constants/jewelry-design-metals';
import { getAvailableMetalsForDesign } from '@/lib/utils/jewelry-pricing';
import {
  decodeMetalRowsFromDesign,
  getDesignDiamondChargeFromDesign,
  getStoneAddonLabelFromDesign,
} from '@/lib/utils/jewelry-design-fields';
import { formatPrice } from '@/lib/utils/format';

const SCOPE_FILTERS = [
  { id: 'all', label: 'All scopes' },
  { id: 'gemstone', label: 'Gemstone' },
  { id: 'rudraksha', label: 'Rudraksha' },
] as const;

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<AdminJewelryDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingFilter, setSettingFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminJewelryDesign | null>(null);
  const [catalogVersion, setCatalogVersion] = useState(0);

  const fetchDesigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (settingFilter !== 'all') params.set('setting_type', settingFilter);
      if (scopeFilter !== 'all') params.set('product_scope', scopeFilter);
      if (includeInactive) params.set('include_inactive', 'true');

      const res = await fetch(`/api/admin/designs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setDesigns(data.designs ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  }, [includeInactive, scopeFilter, settingFilter]);

  useEffect(() => {
    void fetchDesigns();
  }, [fetchDesigns]);

  const stats = useMemo(() => {
    const active = designs.filter((d) => d.is_active).length;
    const gemstone = designs.filter((d) => d.product_scope !== 'rudraksha').length;
    const rudraksha = designs.filter((d) => d.product_scope === 'rudraksha').length;
    return { total: designs.length, active, gemstone, rudraksha };
  }, [designs]);

  const grouped = useMemo(() => {
    const groups: Array<{ key: string; title: string; items: AdminJewelryDesign[] }> = [];

    if (scopeFilter === 'all' || scopeFilter === 'gemstone') {
      for (const type of JEWELRY_DESIGN_SETTING_TYPES) {
        const items = designs.filter(
          (d) => d.product_scope !== 'rudraksha' && d.setting_type === type
        );
        if (items.length > 0) {
          groups.push({
            key: `gem-${type}`,
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} designs`,
            items,
          });
        }
      }
    }

    if (scopeFilter === 'all' || scopeFilter === 'rudraksha') {
      for (const cat of RUDRAKSHA_MOUNTING_CATEGORIES) {
        const items = designs.filter(
          (d) => d.product_scope === 'rudraksha' && d.rudraksha_category === cat.value
        );
        if (items.length > 0) {
          groups.push({ key: `rud-${cat.value}`, title: `Rudraksha — ${cat.label}`, items });
        }
      }
    }

    return groups;
  }, [designs, scopeFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this design? Existing orders keep their reference.')) return;
    try {
      const res = await fetch(`/api/admin/designs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Design deactivated');
      void fetchDesigns();
    } catch {
      toast.error('Failed to deactivate design');
    }
  };

  const handleReactivate = async (design: AdminJewelryDesign) => {
    try {
      const res = await fetch('/api/admin/designs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: design.id,
          name: design.name,
          setting_type: design.setting_type,
          product_scope: design.product_scope,
          rudraksha_category: design.rudraksha_category,
          description: design.description,
          image_url: design.image_url,
          video_url: design.video_url ?? null,
          sort_order: design.sort_order,
          is_active: true,
          design_diamond_charge: getDesignDiamondChargeFromDesign(design.diamond_charges),
          stone_addon_label: getStoneAddonLabelFromDesign(design),
          metal_rows: decodeMetalRowsForPatch(design),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Design reactivated');
      void fetchDesigns();
    } catch {
      toast.error('Failed to reactivate');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (design: AdminJewelryDesign) => {
    setEditing(design);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jewelry Designs"
        description="Manage ring, pendant, bracelet, and Rudraksha mounting designs. Per-design metal pricing uses metals from Metals & Pricing."
        actions={
          <>
            <Link
              href="/admin/metals"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Layers className="h-4 w-4" />
              Metals catalog
            </Link>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" />
              Add design
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStatCard
          label="Total designs"
          value={stats.total}
          icon={Gem}
          tone="text-amber-700"
          bg="bg-amber-50"
        />
        <AdminStatCard
          label="Active"
          value={stats.active}
          icon={Sparkles}
          tone="text-emerald-600"
          bg="bg-emerald-50"
        />
        <AdminStatCard
          label="Gemstone"
          value={stats.gemstone}
          icon={Gem}
          tone="text-violet-600"
          bg="bg-violet-50"
        />
        <AdminStatCard
          label="Rudraksha"
          value={stats.rudraksha}
          icon={Layers}
          tone="text-sky-600"
          bg="bg-sky-50"
        />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
            <p className="mt-0.5 text-xs text-gray-500">Narrow designs by product scope and setting type.</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            Show inactive designs
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap gap-2">
            <span className="mr-1 self-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Scope
            </span>
            {SCOPE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setScopeFilter(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  scopeFilter === f.id
                    ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="hidden h-6 w-px bg-gray-200 sm:block" />

          <div className="flex flex-wrap gap-2">
            <span className="mr-1 self-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Setting
            </span>
            {['all', ...JEWELRY_DESIGN_SETTING_TYPES].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSettingFilter(t)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
                  settingFilter === t
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {scopeFilter !== 'all' && settingFilter !== 'all' && (
        <JewelryMetalCatalogPanel
          key={`${scopeFilter}-${settingFilter}-${catalogVersion}`}
          productScope={scopeFilter}
          settingType={settingFilter}
          defaultOpen
          onCatalogChange={() => setCatalogVersion((v) => v + 1)}
        />
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Design library</h2>
            <p className="text-sm text-gray-500">
              {loading
                ? 'Loading designs…'
                : grouped.length === 0
                  ? 'No designs match the current filters.'
                  : `${stats.total} design${stats.total === 1 ? '' : 's'} shown`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <Gem className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-4 text-base font-semibold text-gray-900">No designs found</p>
            <p className="mt-1 text-sm text-gray-500">
              Adjust filters or create your first jewelry design.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" />
              Add design
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <div key={group.key}>
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">{group.title}</h3>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {group.items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((design) => (
                    <DesignCard
                      key={design.id}
                      design={design}
                      onEdit={() => openEdit(design)}
                      onDelete={() => void handleDelete(design.id)}
                      onReactivate={() => void handleReactivate(design)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <DesignForm
          key={`${editing?.id ?? 'new'}-${catalogVersion}`}
          design={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditing(null);
            void fetchDesigns();
            setCatalogVersion((v) => v + 1);
          }}
          onCatalogChange={() => setCatalogVersion((v) => v + 1)}
        />
      )}
    </div>
  );
}

function DesignCard({
  design,
  onEdit,
  onDelete,
  onReactivate,
}: {
  design: AdminJewelryDesign;
  onEdit: () => void;
  onDelete: () => void;
  onReactivate: () => void;
}) {
  const availableMetals = getAvailableMetalsForDesign(
    design.making_charges,
    design.estimated_metal_weight,
    design.metal_flags
  );
  const silverCharge = design.making_charges?.silver_925;
  const minCharge = Object.values(design.making_charges ?? {}).filter((v) => v > 0);
  const chargeLabel =
    silverCharge != null
      ? `Silver ${formatPrice(silverCharge)}`
      : minCharge.length > 0
        ? `From ${formatPrice(Math.min(...minCharge))}`
        : 'Weight-based pricing';

  const stoneLabel = getStoneAddonLabelFromDesign(design);
  const stoneCharge = getDesignDiamondChargeFromDesign(design.diamond_charges);

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
        design.is_active ? 'border-gray-200' : 'border-red-200/80'
      }`}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100">
        {design.image_url ? (
          <Image
            src={design.image_url}
            alt={design.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
            <Gem className="h-10 w-10" />
            <span className="text-xs">No image</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {!design.is_active && (
            <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Inactive
            </span>
          )}
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold capitalize text-gray-700 shadow-sm backdrop-blur">
            {design.setting_type}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-gray-900">{design.name}</h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={design.product_scope === 'rudraksha' ? 'sky' : 'violet'}>
            {design.product_scope === 'rudraksha' ? 'Rudraksha' : 'Gemstone'}
          </Badge>
          {design.rudraksha_category && (
            <Badge>{design.rudraksha_category.replace(/_/g, ' ')}</Badge>
          )}
        </div>

        <div className="mt-3 space-y-1 text-xs text-gray-500">
          <p>
            <span className="font-medium text-gray-700">Pricing:</span> {chargeLabel}
          </p>
          <p>
            <span className="font-medium text-gray-700">Metals:</span>{' '}
            {availableMetals.length} available
          </p>
          {stoneCharge && stoneCharge > 0 ? (
            <p>
              <span className="font-medium text-gray-700">{stoneLabel ?? 'Stone'}:</span>{' '}
              {formatPrice(stoneCharge)}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex gap-2 pt-4">
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit design
          </button>
          {design.is_active ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-200 px-3 py-2.5 text-red-600 transition hover:bg-red-50"
              title="Deactivate"
              aria-label="Deactivate design"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onReactivate}
              className="rounded-lg border border-emerald-200 px-3 py-2.5 text-emerald-700 transition hover:bg-emerald-50"
              title="Reactivate"
              aria-label="Reactivate design"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Badge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode;
  tone?: 'gray' | 'violet' | 'sky';
}) {
  const tones = {
    gray: 'bg-gray-100 text-gray-600',
    violet: 'bg-violet-50 text-violet-700',
    sky: 'bg-sky-50 text-sky-700',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function decodeMetalRowsForPatch(design: AdminJewelryDesign) {
  return decodeMetalRowsFromDesign(design);
}
