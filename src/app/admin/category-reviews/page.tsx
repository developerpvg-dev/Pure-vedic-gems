'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Pencil, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { subcategoriesForReviewCategory } from '@/lib/reviews/category-config';

interface CategoryReview {
  id: string;
  category: string;
  sub_category: string;
  customer_name: string;
  customer_location: string | null;
  rating: number | null;
  title: string | null;
  review_text: string | null;
  images: string[] | null;
  is_verified: boolean;
  is_approved: boolean;
  is_active: boolean;
  is_featured: boolean;
  source: string;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { slug: 'navaratna', label: 'Navaratna' },
  { slug: 'upratna', label: 'Upratna' },
  { slug: 'rudraksha', label: 'Rudraksha' },
  { slug: 'idol', label: 'Spiritual Idols' },
  { slug: 'jewelry', label: 'Vedic Jewellery' },
  { slug: 'mala', label: 'Malas' },
] as const;

const EMPTY_FORM = {
  category: 'navaratna',
  sub_category: 'ruby',
  customer_name: '',
  customer_location: '',
  rating: 5,
  title: '',
  review_text: '',
  images: [] as string[],
  is_verified: false,
  is_approved: true,
  is_active: true,
  is_featured: false,
};

const REVIEWS_PER_PAGE = 20;

function parseImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export default function AdminCategoryReviewsPage() {
  const [reviews, setReviews] = useState<CategoryReview[]>([]);
  const [category, setCategory] = useState('navaratna');
  const [subCategory, setSubCategory] = useState('ruby');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      category,
      sub_category: subCategory,
      page: String(page),
      limit: String(REVIEWS_PER_PAGE),
    });
    const response = await fetch(`/api/admin/category-reviews?${params.toString()}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null) as {
      reviews?: CategoryReview[];
      total?: number;
      total_pages?: number;
    } | null;
    setReviews((data?.reviews ?? []).map((review) => ({ ...review, images: parseImages(review.images) })));
    setTotal(data?.total ?? 0);
    setTotalPages(data?.total_pages ?? 1);
    setLoading(false);
  }, [category, page, subCategory]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchReviews(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReviews]);

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, category, sub_category: subCategory });
    setShowForm(false);
    setError('');
  }

  function editReview(review: CategoryReview) {
    setEditingId(review.id);
    setForm({
      category: review.category,
      sub_category: review.sub_category,
      customer_name: review.customer_name,
      customer_location: review.customer_location ?? '',
      rating: review.rating ?? 5,
      title: review.title ?? '',
      review_text: review.review_text ?? '',
      images: parseImages(review.images),
      is_verified: review.is_verified,
      is_approved: review.is_approved,
      is_active: review.is_active,
      is_featured: review.is_featured,
    });
    setShowForm(true);
    setError('');
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    const response = await fetch('/api/admin/category-reviews/upload', { method: 'POST', body });
    const data = await response.json().catch(() => null) as { url?: string; error?: string } | null;
    setUploading(false);
    if (!response.ok || !data?.url) {
      setError(data?.error ?? 'Image upload failed');
      return;
    }
    setForm((current) => ({ ...current, images: [...current.images, data.url!].slice(0, 6) }));
  }

  async function saveReview(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      customer_location: form.customer_location || null,
      title: form.title || null,
      images: form.images,
    };

    const response = await fetch(
      editingId ? `/api/admin/category-reviews/${editingId}` : '/api/admin/category-reviews',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json().catch(() => null) as { error?: string } | null;
    setSaving(false);

    if (!response.ok) {
      setError(data?.error ?? 'Could not save review');
      return;
    }

    resetForm();
    void fetchReviews();
  }

  async function deleteReview(id: string) {
    if (!window.confirm('Delete this category review permanently?')) return;
    await fetch(`/api/admin/category-reviews/${id}`, { method: 'DELETE' });
    void fetchReviews();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage shared review pools shown across all products in any catalog sub-category.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...EMPTY_FORM, category, sub_category: subCategory }); }}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add Review
        </button>
      </div>

      <div className="mb-5 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Category</span>
          <select
            value={category}
            onChange={(event) => {
              const nextCategory = event.target.value;
              const nextSub = subcategoriesForReviewCategory(nextCategory)[0]?.slug ?? '';
              setCategory(nextCategory);
              setSubCategory(nextSub);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2"
          >
            {CATEGORY_OPTIONS.map((item) => (
              <option key={item.slug} value={item.slug}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-gray-700">Sub-category</span>
          <select
            value={subCategory}
            onChange={(event) => { setSubCategory(event.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2"
          >
            {subcategoriesForReviewCategory(category).map((item) => (
              <option key={item.slug} value={item.slug}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      {showForm && (
        <form onSubmit={saveReview} className="mb-6 rounded-xl border border-amber-200 bg-amber-50/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Review' : 'Add Category Review'}</h2>
            <button type="button" onClick={resetForm} className="rounded-lg p-2 text-gray-500 hover:bg-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Customer name</span>
              <input required value={form.customer_name} onChange={(e) => setForm((c) => ({ ...c, customer_name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Location</span>
              <input value={form.customer_location} onChange={(e) => setForm((c) => ({ ...c, customer_location: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Rating</span>
              <select value={form.rating} onChange={(e) => setForm((c) => ({ ...c, rating: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-200 px-3 py-2">
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Title</span>
              <input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-gray-700">Review text</span>
              <textarea required rows={4} value={form.review_text} onChange={(e) => setForm((c) => ({ ...c, review_text: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_verified} onChange={(e) => setForm((c) => ({ ...c, is_verified: e.target.checked }))} /> Verified</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_approved} onChange={(e) => setForm((c) => ({ ...c, is_approved: e.target.checked }))} /> Approved</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((c) => ({ ...c, is_active: e.target.checked }))} /> Active</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((c) => ({ ...c, is_featured: e.target.checked }))} /> Featured</label>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Images</span>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
                <Upload className="h-3.5 w-3.5" />
                Upload image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              {uploading && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
            </div>
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.images.map((url) => (
                  <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                    <Image src={url} alt="Review upload preview" fill className="object-cover" sizes="64px" />
                    <button
                      type="button"
                      onClick={() => setForm((c) => ({ ...c, images: c.images.filter((item) => item !== url) }))}
                      className="absolute right-0 top-0 rounded-bl bg-black/60 p-1 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingId ? 'Update review' : 'Create review'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
          No category reviews found for this sub-category.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{review.customer_name}</p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{review.source}</span>
                    {review.is_verified && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Verified</span>}
                    {review.is_featured && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Featured</span>}
                    {!review.is_active && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">Inactive</span>}
                  </div>
                  <div className="mt-2 flex gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4" fill={index < (review.rating ?? 0) ? 'currentColor' : 'none'} />)}
                  </div>
                  {review.title && <h2 className="mt-3 font-semibold text-gray-900">{review.title}</h2>}
                  {review.review_text && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{review.review_text}</p>}
                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.images.map((url) => (
                        <div key={url} className="relative h-14 w-14 overflow-hidden rounded-lg border border-gray-200">
                          <Image src={url} alt="Category review image" fill className="object-cover" sizes="56px" />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleString('en-IN')}
                    {review.customer_location ? ` · ${review.customer_location}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editReview(review)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">
                    <Pencil className="h-3.5 w-3.5" />Edit
                  </button>
                  <button onClick={() => void deleteReview(review.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                    <Trash2 className="h-3.5 w-3.5" />Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          <AdminPagination page={page} totalPages={totalPages} total={total} perPage={REVIEWS_PER_PAGE} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
