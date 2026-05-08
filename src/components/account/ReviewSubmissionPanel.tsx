'use client';

import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';

export interface ReviewEligibleItem {
  product_id: string;
  order_id: string;
  order_number: string;
  product_name: string;
  image_url: string | null;
  existing_review_id: string | null;
}

export function ReviewSubmissionPanel({ items }: { items: ReviewEligibleItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.product_id ?? '');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(() => new Set());

  const activeItem = items.find((item) => item.product_id === activeId);

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (!activeItem) return;
    setIsSubmitting(true);
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: activeItem.product_id,
        order_id: activeItem.order_id,
        rating,
        title,
        review_text: reviewText,
        customer_location: location,
      }),
    }).catch(() => null);
    setIsSubmitting(false);

    if (!response?.ok) {
      const data = await response?.json().catch(() => null) as { error?: string } | null;
      toast.error(data?.error ?? 'Could not submit review');
      return;
    }

    setSubmittedIds((current) => new Set(current).add(activeItem.product_id));
    setTitle('');
    setReviewText('');
    setLocation('');
    setRating(5);
    toast.success('Review submitted for moderation');
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface py-16 text-center">
        <Star className="mx-auto mb-4 h-12 w-12 text-[var(--pvg-accent)]" />
        <p className="font-heading text-xl text-[var(--pvg-primary)]">No delivered purchases ready for review</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--pvg-muted)]">Reviews open after an order is marked delivered so product ratings remain verified and truthful.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-3">
        {items.map((item) => {
          const disabled = Boolean(item.existing_review_id) || submittedIds.has(item.product_id);
          return (
            <button
              key={`${item.order_id}-${item.product_id}`}
              type="button"
              onClick={() => setActiveId(item.product_id)}
              disabled={disabled}
              className={`w-full rounded-2xl border p-4 text-left transition ${activeId === item.product_id ? 'border-[var(--pvg-accent)] bg-brand-gold-light' : 'border-[var(--pvg-border)] bg-brand-surface hover:border-[var(--pvg-accent)]'} disabled:cursor-default disabled:opacity-60`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pvg-accent)]">{item.order_number}</p>
              <p className="mt-1 font-semibold text-[var(--pvg-primary)]">{item.product_name}</p>
              <p className="mt-1 text-xs text-[var(--pvg-muted)]">{disabled ? 'Review submitted or already exists' : 'Eligible verified purchase'}</p>
            </button>
          );
        })}
      </div>

      <form onSubmit={submitReview} className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-5 shadow-sm">
        <h2 className="font-heading text-xl text-[var(--pvg-primary)]">Submit Review</h2>
        <p className="mt-1 text-sm text-[var(--pvg-muted)]">Approved reviews appear on product pages after moderation.</p>
        <div className="mt-5 space-y-4">
          <div>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pvg-muted)]">Rating</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <button key={index} type="button" onClick={() => setRating(index + 1)} className="text-[var(--pvg-accent)]" aria-label={`${index + 1} stars`}>
                  <Star className="h-6 w-6" fill={index < rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pvg-muted)]">Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} className="w-full rounded-lg border border-[var(--pvg-border)] bg-brand-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pvg-accent)]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pvg-muted)]">Review</span>
            <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} required maxLength={1200} rows={5} className="w-full resize-none rounded-lg border border-[var(--pvg-border)] bg-brand-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pvg-accent)]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pvg-muted)]">Location</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={80} placeholder="City, country" className="w-full rounded-lg border border-[var(--pvg-border)] bg-brand-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pvg-accent)]" />
          </label>
        </div>
        <button type="submit" disabled={!activeItem || isSubmitting} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--pvg-bg)] transition hover:bg-brand-accent disabled:cursor-wait disabled:opacity-70">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit for moderation
        </button>
      </form>
    </div>
  );
}