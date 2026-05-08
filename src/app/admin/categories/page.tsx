/* eslint-disable @next/next/no-img-element */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Eye,
  Gem,
  ImagePlus,
  Loader2,
  PackagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

const SECTION_CONFIGS = [
  {
    id: 'navaratna',
    title: 'Navaratna Gemstones',
    eyebrow: 'Nine planetary gem categories',
    source: 'gem',
    type: 'navaratna',
    productCategory: 'navaratna',
    productType: 'gemstone',
    parentSlug: undefined,
    homepageSlot: undefined,
    accent: 'amber',
    fieldHint: 'Name, Vedic second name, origin/location label, main image, hover image.',
  },
  {
    id: 'rudraksha-grid',
    title: 'Rudraksha Beads',
    eyebrow: 'Mukhi category grid',
    source: 'gem',
    type: 'rudraksha',
    productCategory: 'rudraksha',
    productType: 'rudraksha',
    parentSlug: undefined,
    homepageSlot: undefined,
    accent: 'rose',
    fieldHint: 'Name, rare flag, badge/meta label, main image, hover image.',
  },
  {
    id: 'upratna',
    title: 'Semi-Precious Gemstones',
    eyebrow: 'Uparatna circular category rail',
    source: 'gem',
    type: 'upratna',
    productCategory: 'upratna',
    productType: 'gemstone',
    parentSlug: undefined,
    homepageSlot: undefined,
    accent: 'sky',
    fieldHint: 'Name, optional planet/label, main image, hover image.',
  },
  {
    id: 'rudraksha-feature',
    title: 'Rudraksha Feature Cards',
    eyebrow: 'Left side carousel categories',
    source: 'catalog',
    family: 'rudraksha',
    productCategory: 'rudraksha',
    productType: 'rudraksha',
    parentSlug: 'rudraksha',
    homepageSlot: 'rudraksha_feature',
    accent: 'orange',
    fieldHint: 'Collection name, image, subtitle, CTA label, destination path.',
  },
  {
    id: 'explore-idol',
    title: 'Spiritual Idols',
    eyebrow: 'Explore by Category tab',
    source: 'catalog',
    family: 'idol',
    productCategory: 'idol',
    productType: 'idol',
    parentSlug: 'idol',
    homepageSlot: 'explore_idol',
    accent: 'violet',
    fieldHint: 'Category name, material/subtitle, category image, hover image, product destination.',
  },
  {
    id: 'explore-jewelry',
    title: 'Vedic Jewellery',
    eyebrow: 'Explore by Category tab',
    source: 'catalog',
    family: 'jewelry',
    productCategory: 'jewelry',
    productType: 'jewelry',
    parentSlug: 'jewelry',
    homepageSlot: 'explore_jewelry',
    accent: 'emerald',
    fieldHint: 'Category name, jewellery type/subtitle, category image, hover image, product destination.',
  },
] as const;

type SectionConfig = (typeof SECTION_CONFIGS)[number];
type SectionId = SectionConfig['id'];
type CategorySource = 'gem' | 'catalog';

type GemCategoryRow = {
  id: string;
  name: string;
  slug: string;
  type: 'navaratna' | 'upratna' | 'rudraksha';
  sanskrit_name: string | null;
  planet: string | null;
  emoji: string | null;
  color: string | null;
  image_url: string | null;
  hover_image_url: string | null;
  description: string | null;
  display_locations: string | null;
  is_rare?: boolean | null;
  featured_on_homepage?: boolean | null;
  sort_order: number;
  is_active: boolean;
};

type CatalogCategoryRow = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  family: 'idol' | 'jewelry' | 'mala' | 'rudraksha';
  legacy_names?: string[] | null;
  description: string | null;
  image_url: string | null;
  hover_image_url?: string | null;
  homepage_subtitle?: string | null;
  homepage_badge?: string | null;
  show_on_homepage?: boolean | null;
  homepage_slot?: string | null;
  cta_label?: string | null;
  accent_color?: string | null;
  canonical_path: string | null;
  sort_order: number;
  is_active: boolean;
};

type ManagedCategory = {
  id: string;
  source: CategorySource;
  sectionId: SectionId;
  name: string;
  slug: string;
  type?: GemCategoryRow['type'];
  family?: CatalogCategoryRow['family'];
  sanskrit_name?: string | null;
  planet?: string | null;
  color?: string | null;
  image_url?: string | null;
  hover_image_url?: string | null;
  description?: string | null;
  display_locations?: string | null;
  is_rare?: boolean | null;
  featured_on_homepage?: boolean | null;
  homepage_subtitle?: string | null;
  homepage_badge?: string | null;
  show_on_homepage?: boolean | null;
  homepage_slot?: string | null;
  cta_label?: string | null;
  accent_color?: string | null;
  canonical_path?: string | null;
  parent_slug?: string | null;
  sort_order: number;
  is_active: boolean;
};

type CategoryForm = {
  id?: string;
  source: CategorySource;
  sectionId: SectionId;
  name: string;
  slug: string;
  type?: GemCategoryRow['type'];
  family?: CatalogCategoryRow['family'];
  parent_slug?: string;
  sanskrit_name: string;
  planet: string;
  color: string;
  image_url: string;
  hover_image_url: string;
  description: string;
  display_locations: string;
  is_rare: boolean;
  featured_on_homepage: boolean;
  homepage_subtitle: string;
  homepage_badge: string;
  show_on_homepage: boolean;
  homepage_slot: string;
  cta_label: string;
  accent_color: string;
  canonical_path: string;
  sort_order: number;
  is_active: boolean;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function sectionById(id: SectionId) {
  return SECTION_CONFIGS.find((section) => section.id === id) ?? SECTION_CONFIGS[0];
}

function getCatalogSection(row: CatalogCategoryRow): SectionId | null {
  if (row.homepage_slot === 'rudraksha_feature') return 'rudraksha-feature';
  if (row.homepage_slot === 'explore_idol') return 'explore-idol';
  if (row.homepage_slot === 'explore_jewelry') return 'explore-jewelry';
  if (row.family === 'idol' && row.parent_id) return 'explore-idol';
  if ((row.family === 'jewelry' || row.family === 'mala') && row.parent_id) return 'explore-jewelry';
  return null;
}

function normalizeGem(row: GemCategoryRow): ManagedCategory {
  const sectionId = row.type === 'rudraksha' ? 'rudraksha-grid' : row.type;
  return {
    id: row.id,
    source: 'gem',
    sectionId,
    name: row.name,
    slug: row.slug,
    type: row.type,
    sanskrit_name: row.sanskrit_name,
    planet: row.planet,
    color: row.color,
    image_url: row.image_url,
    hover_image_url: row.hover_image_url,
    description: row.description,
    display_locations: row.display_locations,
    is_rare: row.is_rare ?? false,
    featured_on_homepage: row.featured_on_homepage ?? true,
    sort_order: row.sort_order,
    is_active: row.is_active,
  };
}

function normalizeCatalog(row: CatalogCategoryRow): ManagedCategory | null {
  const sectionId = getCatalogSection(row);
  if (!sectionId) return null;
  const section = sectionById(sectionId);

  return {
    id: row.id,
    source: 'catalog',
    sectionId,
    name: row.name,
    slug: row.slug,
    family: row.family,
    parent_slug: section.parentSlug ?? null,
    image_url: row.image_url,
    hover_image_url: row.hover_image_url ?? null,
    description: row.description,
    homepage_subtitle: row.homepage_subtitle ?? row.description,
    homepage_badge: row.homepage_badge,
    show_on_homepage: row.show_on_homepage ?? false,
    homepage_slot: row.homepage_slot ?? section.homepageSlot ?? null,
    cta_label: row.cta_label,
    accent_color: row.accent_color,
    canonical_path: row.canonical_path,
    sort_order: row.sort_order,
    is_active: row.is_active,
  };
}

function createEmptyForm(section: SectionConfig): CategoryForm {
  return {
    source: section.source,
    sectionId: section.id,
    name: '',
    slug: '',
    type: section.source === 'gem' ? section.type : undefined,
    family: section.source === 'catalog' ? section.family : undefined,
    parent_slug: section.parentSlug ?? '',
    sanskrit_name: '',
    planet: '',
    color: '',
    image_url: '',
    hover_image_url: '',
    description: '',
    display_locations: '',
    is_rare: false,
    featured_on_homepage: true,
    homepage_subtitle: '',
    homepage_badge: '',
    show_on_homepage: true,
    homepage_slot: section.homepageSlot ?? '',
    cta_label: section.id === 'rudraksha-feature' ? 'Shop Now' : 'View Category',
    accent_color: '',
    canonical_path: '',
    sort_order: 0,
    is_active: true,
  };
}

function formFromCategory(category: ManagedCategory): CategoryForm {
  const section = sectionById(category.sectionId);
  return {
    id: category.id,
    source: category.source,
    sectionId: category.sectionId,
    name: category.name,
    slug: category.slug,
    type: category.type ?? (section.source === 'gem' ? section.type : undefined),
    family: category.family ?? (section.source === 'catalog' ? section.family : undefined),
    parent_slug: category.parent_slug ?? section.parentSlug ?? '',
    sanskrit_name: category.sanskrit_name ?? '',
    planet: category.planet ?? '',
    color: category.color ?? '',
    image_url: category.image_url ?? '',
    hover_image_url: category.hover_image_url ?? '',
    description: category.description ?? '',
    display_locations: category.display_locations ?? '',
    is_rare: Boolean(category.is_rare),
    featured_on_homepage: category.featured_on_homepage ?? true,
    homepage_subtitle: category.homepage_subtitle ?? '',
    homepage_badge: category.homepage_badge ?? '',
    show_on_homepage: category.show_on_homepage ?? true,
    homepage_slot: category.homepage_slot ?? section.homepageSlot ?? '',
    cta_label: category.cta_label ?? '',
    accent_color: category.accent_color ?? '',
    canonical_path: category.canonical_path ?? '',
    sort_order: category.sort_order,
    is_active: category.is_active,
  };
}

function sectionCount(categories: ManagedCategory[], sectionId: SectionId) {
  return categories.filter((category) => category.sectionId === sectionId).length;
}

function pillClasses(section: SectionConfig, active = false) {
  const colorMap = {
    amber: active ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-gray-200 bg-white text-gray-700 hover:border-amber-200 hover:bg-amber-50',
    rose: active ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-gray-200 bg-white text-gray-700 hover:border-rose-200 hover:bg-rose-50',
    sky: active ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-gray-200 bg-white text-gray-700 hover:border-sky-200 hover:bg-sky-50',
    orange: active ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50',
    violet: active ? 'border-violet-200 bg-violet-50 text-violet-800' : 'border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50',
    emerald: active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50',
  } as const;
  return colorMap[section.accent];
}

function ImageUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('folder', 'homepage-categories');
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      const url = data.urls?.[0] ?? data.url;
      if (url) onUploaded(url);
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={uploading}
      onClick={() => inputRef.current?.click()}
      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-3 py-4 text-sm font-medium text-gray-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
    >
      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {uploading ? 'Uploading...' : 'Upload image'}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.currentTarget.value = '';
        }}
      />
    </button>
  );
}

function ImageField({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</label>
      {helper ? <p className="mt-0.5 text-xs text-gray-400">{helper}</p> : null}
      {value ? (
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <div className="h-16 w-16 overflow-hidden rounded-md border border-gray-200 bg-white">
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-amber-500"
            />
            <button type="button" onClick={() => onChange('')} className="mt-1 text-xs font-medium text-red-600 hover:underline">
              Remove image
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <ImageUploadButton onUploaded={onChange} />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Or paste image URL"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [allCategories, setAllCategories] = useState<ManagedCategory[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<SectionId>('navaratna');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CategoryForm>(() => createEmptyForm(SECTION_CONFIGS[0]));
  const [error, setError] = useState('');

  const activeSection = sectionById(activeSectionId);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/homepage-categories');
    if (response.ok) {
      const data = await response.json();
      const gemRows = (data.gem_categories ?? []) as GemCategoryRow[];
      const catalogRows = (data.catalog_categories ?? []) as CatalogCategoryRow[];
      const normalized = [
        ...gemRows.map(normalizeGem),
        ...catalogRows.map(normalizeCatalog).filter((item): item is ManagedCategory => Boolean(item)),
      ].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
      setAllCategories(normalized);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void fetchCategories());
  }, [fetchCategories]);

  const visibleCategories = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return allCategories.filter((category) => {
      if (category.sectionId !== activeSectionId) return false;
      if (!cleanQuery) return true;
      return [category.name, category.slug, category.sanskrit_name, category.display_locations, category.homepage_subtitle]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(cleanQuery));
    });
  }, [activeSectionId, allCategories, query]);

  function openCreate(section = activeSection) {
    setForm(createEmptyForm(section));
    setEditing(false);
    setShowForm(true);
    setError('');
  }

  function openEdit(category: ManagedCategory) {
    setForm(formFromCategory(category));
    setEditing(true);
    setShowForm(true);
    setError('');
  }

  function updateForm<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const method = editing ? 'PUT' : 'POST';
    const payload = {
      ...form,
      source: form.source,
      type: form.source === 'gem' ? form.type : undefined,
      family: form.source === 'catalog' ? form.family : undefined,
      parent_slug: form.source === 'catalog' ? form.parent_slug : undefined,
      slug: slugify(form.slug || form.name),
      canonical_path: form.canonical_path || `/shop/${slugify(form.slug || form.name)}`,
    };

    const response = await fetch('/api/admin/homepage-categories', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setShowForm(false);
      setEditing(false);
      await fetchCategories();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Failed to save category');
    }

    setSaving(false);
  }

  async function toggleActive(category: ManagedCategory) {
    const payload = {
      ...formFromCategory(category),
      is_active: !category.is_active,
    };
    const response = await fetch('/api/admin/homepage-categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) await fetchCategories();
  }

  async function deactivateCategory(category: ManagedCategory) {
    if (!confirm(`Deactivate "${category.name}"? Products remain safe, but this category/card will be hidden.`)) return;
    const response = await fetch(`/api/admin/homepage-categories?source=${category.source}&id=${category.id}`, { method: 'DELETE' });
    if (response.ok) await fetchCategories();
  }

  function productCreateHref(category: ManagedCategory) {
    const section = sectionById(category.sectionId);
    const params = new URLSearchParams({
      category: section.productCategory,
      product_type: section.productType,
      sub_category: category.slug,
    });
    return `/admin/products/new?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            Homepage Catalog
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-950">Section Categories</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
            Manage the exact category cards shown on the homepage: gemstone names and locations, Rudraksha rarity, Explore by Category collections, and product entry points.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <PackagePlus className="h-4 w-4" />
            Add Product
          </Link>
          <button
            type="button"
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Add Section Category
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-2 xl:sticky xl:top-6 xl:self-start">
          {SECTION_CONFIGS.map((section) => {
            const active = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => { setActiveSectionId(section.id); setQuery(''); }}
                className={`w-full rounded-xl border p-4 text-left transition ${pillClasses(section, active)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{section.title}</div>
                    <div className="mt-0.5 text-xs opacity-75">{section.eyebrow}</div>
                  </div>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">
                    {sectionCount(allCategories, section.id)}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                  <Gem className="h-4 w-4" />
                  {activeSection.source === 'gem' ? 'Gem category data' : 'Catalog category data'}
                </div>
                <h2 className="mt-2 text-xl font-bold text-gray-950">{activeSection.title}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">{activeSection.fieldHint}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void fetchCategories()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => openCreate(activeSection)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Here
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search this section..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="text-xs text-gray-400">
                {visibleCategories.length} visible in this view
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-230 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Category Card</th>
                  <th className="px-4 py-3 font-semibold">Section Fields</th>
                  <th className="px-4 py-3 font-semibold">Images</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-600" />
                      Loading categories...
                    </td>
                  </tr>
                ) : visibleCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-gray-400">
                      No categories in this section yet.
                      <button type="button" onClick={() => openCreate(activeSection)} className="ml-1 font-semibold text-amber-700 hover:underline">
                        Add one now.
                      </button>
                    </td>
                  </tr>
                ) : visibleCategories.map((category) => (
                  <tr key={`${category.source}-${category.id}`} className="align-top transition hover:bg-gray-50/70">
                    <td className="px-4 py-4 text-gray-500">{category.sort_order}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                          {category.image_url ? <img src={category.image_url} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="m-3 h-6 w-6 text-gray-300" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-950">{category.name}</div>
                          <div className="font-mono text-xs text-gray-400">{category.slug}</div>
                          {category.canonical_path ? <div className="mt-1 text-xs text-gray-400">{category.canonical_path}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {category.source === 'gem' ? (
                        <div className="space-y-1.5">
                          {category.sanskrit_name ? <div>Second name: <span className="font-medium text-gray-900">{category.sanskrit_name}</span></div> : null}
                          {category.display_locations ? <div>Label: <span className="font-medium text-gray-900">{category.display_locations}</span></div> : null}
                          {category.planet ? <div>Planet: <span className="font-medium text-gray-900">{category.planet}</span></div> : null}
                          {category.is_rare ? <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Rare</span> : null}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {category.homepage_subtitle ? <div>Subtitle: <span className="font-medium text-gray-900">{category.homepage_subtitle}</span></div> : null}
                          {category.homepage_badge ? <div>Badge: <span className="font-medium text-gray-900">{category.homepage_badge}</span></div> : null}
                          {category.cta_label ? <div>CTA: <span className="font-medium text-gray-900">{category.cta_label}</span></div> : null}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${category.image_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>Main</span>
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${category.hover_image_url ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>Hover</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => void toggleActive(category)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition ${
                          category.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {category.is_active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {category.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={productCreateHref(category)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                        >
                          <PackagePlus className="h-3.5 w-3.5" />
                          Add Product
                        </Link>
                        <Link
                          href={category.canonical_path || `/shop/${category.slug}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-amber-700"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deactivateCategory(category)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Deactivate ${category.name}`}
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
        </section>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-950">{editing ? 'Edit Category' : `Add ${sectionById(form.sectionId).title} Category`}</h2>
                <p className="mt-0.5 text-sm text-gray-500">{sectionById(form.sectionId).fieldHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close category form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitForm} className="max-h-[calc(92vh-82px)] overflow-y-auto p-6">
              <div className="space-y-5">
                {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Name *</label>
                    <input
                      value={form.name}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((current) => ({ ...current, name: value, slug: editing ? current.slug : slugify(value) }));
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Slug *</label>
                    <input
                      value={form.slug}
                      onChange={(event) => updateForm('slug', slugify(event.target.value))}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                {form.source === 'gem' ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Second / Vedic Name</label>
                        <input
                          value={form.sanskrit_name}
                          onChange={(event) => updateForm('sanskrit_name', event.target.value)}
                          placeholder="Manik, Pukhraj, Moti..."
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Planet</label>
                        <input
                          value={form.planet}
                          onChange={(event) => updateForm('planet', event.target.value)}
                          placeholder="Sun, Moon, Rahu..."
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Card Color</label>
                        <input
                          value={form.color}
                          onChange={(event) => updateForm('color', event.target.value)}
                          placeholder="#B8861E"
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {form.type === 'rudraksha' ? 'Badge / Rarity Label' : 'Homepage Locations'}
                      </label>
                      <input
                        value={form.display_locations}
                        onChange={(event) => updateForm('display_locations', event.target.value)}
                        placeholder={form.type === 'rudraksha' ? 'Rare, Classic, Premium...' : 'Burma · Mozambique'}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {form.type === 'rudraksha' ? (
                      <label className="flex items-center gap-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                        <input
                          type="checkbox"
                          checked={form.is_rare}
                          onChange={(event) => updateForm('is_rare', event.target.checked)}
                          className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                        />
                        Mark this Rudraksha category as rare
                      </label>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Homepage Subtitle</label>
                        <input
                          value={form.homepage_subtitle}
                          onChange={(event) => updateForm('homepage_subtitle', event.target.value)}
                          placeholder="Brass · Hand-crafted"
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">CTA Label</label>
                        <input
                          value={form.cta_label}
                          onChange={(event) => updateForm('cta_label', event.target.value)}
                          placeholder="View Category"
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Badge</label>
                        <input
                          value={form.homepage_badge}
                          onChange={(event) => updateForm('homepage_badge', event.target.value)}
                          placeholder="SALE, Featured, Rare"
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Accent Color</label>
                        <input
                          value={form.accent_color}
                          onChange={(event) => updateForm('accent_color', event.target.value)}
                          placeholder="#B8861E"
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Sort Order</label>
                        <input
                          type="number"
                          value={form.sort_order}
                          onChange={(event) => updateForm('sort_order', Number(event.target.value) || 0)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Destination Path</label>
                      <input
                        value={form.canonical_path}
                        onChange={(event) => updateForm('canonical_path', event.target.value)}
                        placeholder={`/shop/${form.slug || 'category-slug'}`}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <label className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                      <input
                        type="checkbox"
                        checked={form.show_on_homepage}
                        onChange={(event) => updateForm('show_on_homepage', event.target.checked)}
                        className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Show this category/card on the homepage section
                    </label>
                  </>
                )}

                {form.source === 'gem' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Sort Order</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(event) => updateForm('sort_order', Number(event.target.value) || 0)}
                      className="mt-1 w-32 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ImageField
                    label="Main Image"
                    value={form.image_url}
                    onChange={(value) => updateForm('image_url', value)}
                    helper="Shown by default on the homepage card."
                  />
                  <ImageField
                    label="Secondary Hover Image"
                    value={form.hover_image_url}
                    onChange={(value) => updateForm('hover_image_url', value)}
                    helper="Fades in when the visitor hovers the card."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateForm('description', event.target.value)}
                    rows={3}
                    placeholder="Optional SEO/shop header description..."
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => updateForm('is_active', event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  Active
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name || !form.slug}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
