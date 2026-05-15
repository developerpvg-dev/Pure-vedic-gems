'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Star, X } from 'lucide-react';
import { productHref } from '@/lib/categories/storefront';
import { AdminPagination } from '@/components/admin/AdminPagination';

interface AdminReview {
  id: string;
  customer_name: string;
  customer_location: string | null;
  rating: number | null;
  title: string | null;
  review_text: string | null;
  is_verified: boolean;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  products?: { id: string; name: string; slug: string; category: string; thumbnail_url: string | null } | null;
}

const REVIEWS_PER_PAGE = 20;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status, page: String(page), limit: String(REVIEWS_PER_PAGE) });
    const response = await fetch(`/api/admin/reviews?${params.toString()}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null) as { reviews?: AdminReview[]; total?: number; total_pages?: number } | null;
    setReviews(data?.reviews ?? []);
    setTotal(data?.total ?? 0);
    setTotalPages(data?.total_pages ?? 1);
    setLoading(false);
  }, [page, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchReviews(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchReviews]);

  async function moderate(id: string, action: 'approve' | 'reject' | 'feature' | 'unfeature') {
    setSavingId(id);
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setSavingId(null);
    void fetchReviews();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
          <p className="mt-1 text-sm text-gray-500">Approve verified reviews before ratings appear publicly.</p>
        </div>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="featured">Featured</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-amber-600" /></div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">No reviews found.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{review.customer_name}</p>
                    {review.is_verified && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Verified</span>}
                    {review.is_approved ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Approved</span> : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>}
                    {review.is_featured && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Featured</span>}
                  </div>
                  <div className="mt-2 flex gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4" fill={index < (review.rating ?? 0) ? 'currentColor' : 'none'} />)}
                  </div>
                  {review.products && (
                    <Link href={productHref(review.products)} className="mt-2 inline-block text-xs font-medium text-amber-700 hover:underline">
                      {review.products.name}
                    </Link>
                  )}
                  {review.title && <h2 className="mt-3 font-semibold text-gray-900">{review.title}</h2>}
                  {review.review_text && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{review.review_text}</p>}
                  <p className="mt-3 text-xs text-gray-400">{new Date(review.created_at).toLocaleString('en-IN')}{review.customer_location ? ` · ${review.customer_location}` : ''}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => moderate(review.id, 'approve')} disabled={savingId === review.id} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><Check className="h-3.5 w-3.5" />Approve</button>
                  <button onClick={() => moderate(review.id, 'reject')} disabled={savingId === review.id} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><X className="h-3.5 w-3.5" />Reject</button>
                  <button onClick={() => moderate(review.id, review.is_featured ? 'unfeature' : 'feature')} disabled={savingId === review.id} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-60"><Star className="h-3.5 w-3.5" />{review.is_featured ? 'Unfeature' : 'Feature'}</button>
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