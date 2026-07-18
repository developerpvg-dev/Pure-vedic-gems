'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, PackageSearch, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  AccountOrderCard,
  type AccountOrderCardData,
} from '@/components/account/AccountOrderCard';

interface TrackingEvent {
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  event_time: string;
  location: string | null;
  note: string | null;
}

type TrackingOrder = AccountOrderCardData & {
  can_cancel?: boolean;
  record_ceremony?: boolean;
};

interface TrackingResult {
  order: TrackingOrder;
  events: TrackingEvent[];
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function OrderTrackingLookup() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const autoSubmitted = useRef(false);

  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [token, setToken] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const lookupOrder = useCallback(async (payload: { order_number: string; contact?: string; token?: string }) => {
    const trimmedOrder = payload.order_number.trim();
    if (!trimmedOrder) {
      setError('Please enter your order number.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/orders/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: trimmedOrder,
          contact: payload.contact?.trim() || undefined,
          token: payload.token?.trim() || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as (TrackingResult & { error?: string }) | null;

      if (!response.ok || !data || data.error) {
        setError(data?.error ?? 'Tracking access could not be verified. Check your order number and contact details.');
        return;
      }

      setResult(data);
    } catch {
      setError('Unable to reach the tracking service. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const orderFromUrl =
      searchParams.get('order') ??
      searchParams.get('order_number') ??
      searchParams.get('orderNumber') ??
      '';
    const contactFromUrl =
      searchParams.get('contact') ??
      searchParams.get('email') ??
      searchParams.get('phone') ??
      '';
    const tokenFromUrl = searchParams.get('token') ?? '';

    if (!orderFromUrl) return;

    setOrderNumber(orderFromUrl);
    if (contactFromUrl) setContact(contactFromUrl);
    if (tokenFromUrl) setToken(tokenFromUrl);

    if (autoSubmitted.current) return;
    autoSubmitted.current = true;

    void lookupOrder({
      order_number: orderFromUrl,
      contact: contactFromUrl,
      token: tokenFromUrl,
    });
  }, [lookupOrder, searchParams]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await lookupOrder({ order_number: orderNumber, contact, token });
  }

  const timelineEvents = result
    ? [...result.events].sort(
        (a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime(),
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="pvg-track-form-card h-fit rounded-xl border border-[#ede6d5] bg-white p-5 shadow-[0_10px_32px_rgba(44,4,4,0.06)]"
        >
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fdf3e7] text-[#7a1515]">
              <PackageSearch className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="pvg-track-form-title">Lookup Order</h2>
              <p className="pvg-track-form-sub">
                Enter your order number and the email or phone used at checkout.
              </p>
            </div>
          </div>

          {!authLoading && isAuthenticated ? (
            <p className="pvg-track-signed-in">
              You&apos;re signed in — if this order is on your account, you can track with the order number alone.
            </p>
          ) : null}

          <div className="space-y-4">
            <label className="block">
              <span className="pvg-track-field-label">Order number</span>
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                required
                autoComplete="off"
                placeholder="e.g. PVG-2024-00123"
                className="pvg-track-field"
              />
            </label>

            <label className="block">
              <span className="pvg-track-field-label">Email or phone</span>
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                autoComplete="email tel"
                placeholder="Used when placing the order"
                className="pvg-track-field"
              />
              <p className="pvg-track-field-hint">
                Required for guest orders. Optional if you are signed in to the account that placed the order.
              </p>
            </label>

            <details className="pvg-track-token-details">
              <summary>Have a secure tracking link?</summary>
              <label className="mt-3 block">
                <span className="pvg-track-field-label">Secure token</span>
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  autoComplete="off"
                  placeholder="Paste token from your confirmation link"
                  className="pvg-track-field"
                />
              </label>
            </details>
          </div>

          {error ? <p className="pvg-track-error" role="alert">{error}</p> : null}

          <button type="submit" disabled={isLoading} className="pvg-track-submit">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {isLoading ? 'Looking up…' : 'Track securely'}
          </button>
        </form>

        <div className="min-w-0 space-y-4">
          {!result ? (
            <div className="pvg-track-result-panel flex min-h-[280px] items-center justify-center rounded-xl border border-[#ede6d5] bg-white p-5 shadow-[0_10px_32px_rgba(44,4,4,0.06)] md:p-6">
              <div className="pvg-track-empty">
                <div>
                  <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-[#b8861e]" aria-hidden="true" />
                  <h2>Private tracking</h2>
                  <p>
                    Order details are shown only after matching the order number with your account, email, phone, or secure token.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <AccountOrderCard
                order={result.order}
                defaultDetailsOpen
                allowCancel={Boolean(result.order.can_cancel)}
              />

              <div className="rounded-xl border border-[#ede6d5] bg-white p-5 shadow-[0_10px_32px_rgba(44,4,4,0.06)] md:p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7a1515]">
                  Shipment updates
                </h3>
                <div className="mt-4 space-y-3">
                  {timelineEvents.length > 0 ? (
                    timelineEvents.map((event) => (
                      <article
                        key={`${event.status}-${event.event_time}-${event.note ?? ''}`}
                        className="rounded-xl border border-[#ede6d5] bg-[#faf8f4] px-4 py-3"
                      >
                        <h4 className="text-sm font-semibold capitalize text-[#3d2b1f]">
                          {formatStatus(event.status)}
                        </h4>
                        <p className="mt-1 text-xs text-[#6b5b4e]">
                          {formatDate(event.event_time)}
                          {event.location ? ` · ${event.location}` : ''}
                          {event.carrier ? ` · ${event.carrier}` : ''}
                        </p>
                        {event.note ? <p className="mt-1 text-sm text-[#5a5043]">{event.note}</p> : null}
                        {event.tracking_url ? (
                          <a
                            href={event.tracking_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs font-semibold text-[#7a1515] underline-offset-2 hover:underline"
                          >
                            View carrier update
                          </a>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <p className="rounded-xl border border-[#ede6d5] bg-[#faf8f4] p-4 text-sm leading-relaxed text-[#6b5b4e]">
                      Your order is confirmed. Carrier shipment events will appear here once the package is handed to the courier.
                    </p>
                  )}
                </div>

                {isAuthenticated ? (
                  <Link href="/account/orders" className="pvg-track-account-link mt-4 inline-block">
                    View all orders in your account →
                  </Link>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
