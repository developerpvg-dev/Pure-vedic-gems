'use client';

import { useState } from 'react';
import { Loader2, PackageSearch, ShieldCheck } from 'lucide-react';

interface TrackingEvent {
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  event_time: string;
  location: string | null;
  note: string | null;
}

interface TrackingResult {
  order: {
    order_number: string;
    status: string;
    tracking_number: string | null;
    tracking_url: string | null;
    estimated_delivery: string | null;
    created_at: string;
  };
  events: TrackingEvent[];
}

export function OrderTrackingLookup() {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [token, setToken] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    const response = await fetch('/api/orders/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_number: orderNumber, contact, token: token || undefined }),
    }).catch(() => null);
    setIsLoading(false);

    const data = await response?.json().catch(() => null) as TrackingResult & { error?: string } | null;
    if (!response?.ok || !data || data.error) {
      setError(data?.error ?? 'Tracking access could not be verified');
      return;
    }
    setResult(data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold-light text-[var(--pvg-accent)]">
            <PackageSearch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-xl text-[var(--pvg-primary)]">Track Order</h2>
            <p className="mt-1 text-sm text-[var(--pvg-muted)]">Use order number plus email or phone for safe guest access.</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pvg-muted)]">Order number</span>
            <input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} required className="w-full rounded-lg border border-[var(--pvg-border)] bg-brand-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pvg-accent)]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pvg-muted)]">Email or phone</span>
            <input value={contact} onChange={(event) => setContact(event.target.value)} required className="w-full rounded-lg border border-[var(--pvg-border)] bg-brand-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pvg-accent)]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pvg-muted)]">Secure token</span>
            <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Optional guest link token" className="w-full rounded-lg border border-[var(--pvg-border)] bg-brand-bg px-3 py-2.5 text-sm outline-none focus:border-[var(--pvg-accent)]" />
          </label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={isLoading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--pvg-bg)] transition hover:bg-brand-accent disabled:cursor-wait disabled:opacity-70">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Track securely
        </button>
      </form>

      <div className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-5 md:p-6">
        {result ? (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--pvg-border)] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pvg-accent)]">{result.order.order_number}</p>
                <h2 className="mt-1 font-heading text-2xl text-[var(--pvg-primary)]">{result.order.status.replace(/_/g, ' ')}</h2>
              </div>
              {result.order.tracking_url ? (
                <a href={result.order.tracking_url} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--pvg-border)] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--pvg-primary)] hover:border-[var(--pvg-accent)]">Carrier tracking</a>
              ) : null}
            </div>
            <div className="mt-5 space-y-4">
              {result.events.length > 0 ? result.events.map((event) => (
                <div key={`${event.status}-${event.event_time}`} className="rounded-xl border border-[var(--pvg-border)] bg-brand-bg-alt p-4">
                  <p className="font-semibold capitalize text-[var(--pvg-primary)]">{event.status.replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-xs text-[var(--pvg-muted)]">{new Date(event.event_time).toLocaleString('en-IN')}{event.location ? ` · ${event.location}` : ''}</p>
                  {event.note && <p className="mt-2 text-sm text-[var(--pvg-text)]">{event.note}</p>}
                </div>
              )) : (
                <div className="rounded-xl border border-[var(--pvg-border)] bg-brand-bg-alt p-5 text-sm text-[var(--pvg-muted)]">Tracking events will appear after fulfillment updates the shipment.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center text-center">
            <div>
              <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-[var(--pvg-accent)]" />
              <p className="font-heading text-xl text-[var(--pvg-primary)]">Private tracking</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--pvg-muted)]">Order details are shown only after matching the order number with account access, secure token, email, or phone.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}