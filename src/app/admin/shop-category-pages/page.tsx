'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  ImageOff,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { getCategoryHubSectionDefs } from '@/lib/categories/shop-category-hub-sections';
import type { ShopCategoryPageContent } from '@/lib/types/shop-category-page';

const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor').then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-lg bg-gray-100" /> },
);

type AdminPage = ShopCategoryPageContent & { hasDbRow?: boolean };

const NEW_CATEGORY_SENTINEL = '__new__';

const PRODUCT_CATEGORY_OPTIONS = [
  { value: 'navaratna', label: 'Navaratna (main planetary gem)' },
  { value: 'upratna', label: 'Upratna (semi-precious substitute gem)' },
  { value: 'gemstone', label: 'Gemstone (general)' },
  { value: 'rudraksha', label: 'Rudraksha' },
  { value: 'idol', label: 'Idol / Murti' },
  { value: 'jewelry', label: 'Jewellery' },
  { value: 'mala', label: 'Mala' },
];

const EMPTY_FORM: ShopCategoryPageContent = {
  slug: '',
  name: '',
  product_category: 'navaratna',
  hero_benefits: [],
  faqs: [],
  meta_keywords: [],
  geo_service_areas: [],
  is_active: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ShopCategoryPagesAdmin() {
  const [pages, setPages] = useState<AdminPage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [form, setForm] = useState<ShopCategoryPageContent>(EMPTY_FORM);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true);
    try {
      const res = await fetch('/api/admin/shop-category-pages');
      const data = await res.json();
      setPages(data.pages ?? []);
      return (data.pages ?? []) as AdminPage[];
    } finally {
      if (!opts?.quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(
      (p) =>
        p.slug.includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.product_category.toLowerCase().includes(q),
    );
  }, [pages, search]);

  const selectPage = (page: AdminPage) => {
    setIsCreatingNew(false);
    setSelectedSlug(page.slug);
    setForm({
      ...page,
      hero_benefits: page.hero_benefits ?? [],
      faqs: page.faqs ?? [],
      meta_keywords: page.meta_keywords ?? [],
      geo_service_areas: page.geo_service_areas ?? [],
    });
    setMessage('');
  };

  const startNewCategory = () => {
    setIsCreatingNew(true);
    setSelectedSlug(NEW_CATEGORY_SENTINEL);
    setForm({ ...EMPTY_FORM });
    setMessage('');
  };

  const updateField = <K extends keyof ShopCategoryPageContent>(key: K, value: ShopCategoryPageContent[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadHeroImage = async (file: File | undefined) => {
    if (!file) return;
    setUploadingImage(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('folder', 'shop-category-pages');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.urls?.[0]) {
        throw new Error(data.error || 'Image upload failed');
      }
      updateField('hero_image_url', data.urls[0]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const generateDraft = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.product_category.trim()) {
      setMessage('Please fill Name, Slug, and Product Category before generating a draft.');
      return;
    }
    setGeneratingDraft(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/shop-category-pages/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: form.slug,
          name: form.name,
          product_category: form.product_category,
          sanskrit_name: form.sanskrit_name,
          planet: form.planet,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Draft generation failed');
      setForm((prev) => ({
        ...data.page,
        slug: prev.slug,
        name: prev.name,
        sanskrit_name: prev.sanskrit_name,
        planet: prev.planet,
        product_category: prev.product_category,
        hero_image_url: prev.hero_image_url,
        image_url: prev.image_url,
      }));
      setMessage('Draft generated below. Review, personalize, and add images before saving.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Draft generation failed');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const save = async () => {
    if (!form.slug.trim() || !form.name.trim() || !form.product_category.trim()) {
      setMessage('Slug, Name, and Product Category are required.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/shop-category-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      const saved = data.page as AdminPage | undefined;
      if (saved) {
        selectPage({ ...saved, hasDbRow: true });
      } else {
        setIsCreatingNew(false);
        setSelectedSlug(form.slug);
      }
      setMessage('Saved successfully. Category page updated.');
      await load({ quiet: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!selectedSlug || selectedSlug === NEW_CATEGORY_SENTINEL) return;
    if (!confirm(`Delete "${form.name}" (${form.slug})? This cannot be undone.`)) return;
    setDeleting(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/shop-category-pages?slug=${encodeURIComponent(selectedSlug)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setMessage('Category page deleted.');
      setSelectedSlug('');
      setForm(EMPTY_FORM);
      await load({ quiet: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const seedAll = async () => {
    setSeeding(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/shop-category-pages/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Seed failed');
      setMessage(`Seeded ${data.seeded} category pages to database.`);
      await load({ quiet: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Shop SEO</p>
          <h1 className="text-2xl font-bold text-gray-950">Category Hub Pages</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Manage rich SEO content for each shop category — About, How To Wear, Benefits, FAQs, images, and more.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startNewCategory}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            New Category
          </button>
          <div className="flex max-w-sm flex-col gap-2">
            <button
              type="button"
              onClick={seedAll}
              disabled={seeding}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Seed All Defaults
            </button>
            <p className="text-xs text-gray-500">
              Re-seeds all built-in category content from the latest templates. Existing rows will be overwritten.
            </p>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-2">
            {filtered.map((page) => (
              <button
                key={page.slug}
                type="button"
                onClick={() => selectPage(page)}
                className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  selectedSlug === page.slug && !isCreatingNew ? 'bg-amber-100 font-semibold text-amber-950' : 'hover:bg-gray-50'
                }`}
              >
                <span className="block">{page.name}</span>
                <span className="text-xs text-gray-500">
                  {page.slug} · {page.product_category}
                  {page.hasDbRow ? '' : ' · defaults'}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6">
          {!selectedSlug ? (
            <p className="text-sm text-gray-500">
              Select a category from the left to edit its hub page content, or click{' '}
              <span className="font-semibold text-gray-700">New Category</span> to create one.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-950">{form.name || 'New Category'}</h2>
                  {isCreatingNew ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Creating new category — not yet saved</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {!isCreatingNew ? (
                    <Link
                      href={`/shop/${form.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 hover:underline"
                    >
                      Preview <ExternalLink className="h-4 w-4" />
                    </Link>
                  ) : null}
                  {!isCreatingNew ? (
                    <button
                      type="button"
                      onClick={deleteCategory}
                      disabled={deleting}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Name</span>
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      updateField('name', name);
                      if (isCreatingNew && !form.slug) {
                        updateField('slug', slugify(name));
                      }
                    }}
                    placeholder="e.g. Blue Sapphire"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Slug (URL: /shop/…)</span>
                  <input
                    value={form.slug}
                    onChange={(e) => updateField('slug', slugify(e.target.value))}
                    placeholder="e.g. blue-sapphire"
                    readOnly={!isCreatingNew}
                    className={`w-full rounded-lg border border-gray-200 px-3 py-2 ${!isCreatingNew ? 'bg-gray-50 text-gray-500' : ''}`}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Product Category</span>
                  <select
                    value={form.product_category}
                    onChange={(e) => updateField('product_category', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    {PRODUCT_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Sanskrit / Alternate Name</span>
                  <input
                    value={form.sanskrit_name ?? ''}
                    onChange={(e) => updateField('sanskrit_name', e.target.value)}
                    placeholder="e.g. Neelam"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">SEO Title</span>
                  <input
                    value={form.seo_title ?? ''}
                    onChange={(e) => updateField('seo_title', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Ruling Planet (if applicable)</span>
                  <input
                    value={form.planet ?? ''}
                    onChange={(e) => updateField('planet', e.target.value)}
                    placeholder="e.g. Saturn (Shani)"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
              </div>

              {isCreatingNew ? (
                <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Generate a starting draft</p>
                      <p className="text-xs text-amber-700">
                        Fills every section below (About, How To Wear, Benefits, FAQs…) with structured starter content
                        you can then personalize — just like every other category page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={generateDraft}
                      disabled={generatingDraft}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:opacity-60"
                    >
                      {generatingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      Generate Draft Content
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700">Hero / Category Image</span>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {form.hero_image_url || form.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.hero_image_url ?? form.image_url ?? ''}
                        alt="Hero preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageOff className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      value={form.hero_image_url ?? ''}
                      onChange={(e) => updateField('hero_image_url', e.target.value)}
                      placeholder="https://... (paste an image URL)"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-amber-500 hover:text-amber-700">
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(event) => {
                          uploadHeroImage(event.target.files?.[0]);
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      Shown on the right side of this category&apos;s hero banner and on the shop browse cards.
                    </p>
                  </div>
                </div>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">SEO Description</span>
                <textarea
                  value={form.seo_description ?? ''}
                  onChange={(e) => updateField('seo_description', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Meta Keywords (comma separated)</span>
                <textarea
                  value={(form.meta_keywords ?? []).join(', ')}
                  onChange={(e) =>
                    updateField(
                      'meta_keywords',
                      e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                    )
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Intro (Hero)</span>
                <textarea
                  value={form.intro_text ?? ''}
                  onChange={(e) => updateField('intro_text', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Hero Benefits (one per line)</span>
                <textarea
                  value={(form.hero_benefits ?? []).map((b) => b.text).join('\n')}
                  onChange={(e) =>
                    // Keep blank lines while typing so Enter can add another benefit;
                    // empty lines are dropped on save in parseBenefits.
                    updateField(
                      'hero_benefits',
                      e.target.value.split('\n').map((text) => ({ text })),
                    )
                  }
                  rows={4}
                  placeholder={'Career & Leadership\nHealth & Vitality\nEmotional Balance\nProsperity & Growth'}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  One short phrase per line. Empty lines are ignored when you save.
                </span>
              </label>

              {getCategoryHubSectionDefs(form.product_category ?? 'gemstone').map((section) => (
                <div key={section.key}>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {section.title(form.name || 'Category')}
                  </label>
                  <RichTextEditor
                    value={String(form[section.field] ?? '')}
                    onChange={(html) => updateField(section.field, html)}
                    placeholder={`Write ${section.title(form.name || 'Category')} content...`}
                  />
                </div>
              ))}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">FAQs</label>
                  <button
                    type="button"
                    onClick={() =>
                      updateField('faqs', [...(form.faqs ?? []), { question: '', answer: '' }])
                    }
                    className="text-xs font-semibold text-amber-800 hover:underline"
                  >
                    + Add FAQ
                  </button>
                </div>
                <div className="space-y-3">
                  {(form.faqs ?? []).map((faq, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-3">
                      <input
                        value={faq.question}
                        onChange={(e) => {
                          const next = [...(form.faqs ?? [])];
                          next[index] = { ...faq, question: e.target.value };
                          updateField('faqs', next);
                        }}
                        placeholder="Question"
                        className="mb-2 w-full rounded border border-gray-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={(e) => {
                          const next = [...(form.faqs ?? [])];
                          next[index] = { ...faq, answer: e.target.value };
                          updateField('faqs', next);
                        }}
                        placeholder="Answer"
                        rows={3}
                        className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = (form.faqs ?? []).filter((_, i) => i !== index);
                          updateField('faqs', next);
                        }}
                        className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Geo — Primary City</span>
                  <input
                    value={form.geo_primary_city ?? ''}
                    onChange={(e) => updateField('geo_primary_city', e.target.value)}
                    placeholder="New Delhi"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Geo — Primary Country</span>
                  <input
                    value={form.geo_primary_country ?? ''}
                    onChange={(e) => updateField('geo_primary_country', e.target.value)}
                    placeholder="IN"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Geo — Service Areas (comma separated)</span>
                  <input
                    value={(form.geo_service_areas ?? []).join(', ')}
                    onChange={(e) =>
                      updateField(
                        'geo_service_areas',
                        e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                      )
                    }
                    placeholder="India, USA, UK..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="font-medium text-gray-700">Published (visible on the storefront)</span>
              </label>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Category Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
