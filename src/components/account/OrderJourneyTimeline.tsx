import Link from 'next/link';
import { Check, ExternalLink, ImageIcon, PlayCircle, Truck, AlertTriangle } from 'lucide-react';
import {
  getCustomerJourney,
  type CustomerJourneyInput,
  type JourneyMilestone,
} from '@/lib/orders/customer-journey';
import { deliveryProofProxyUrl } from '@/lib/orders/dispatch-proof';

type OrderJourneyTimelineProps = CustomerJourneyInput & {
  compact?: boolean;
  orderId?: string;
};

function formatDeliveryDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ProgressHeader({
  milestones,
  activeIndex,
}: {
  milestones: JourneyMilestone[];
  activeIndex: number;
}) {
  const current = milestones[activeIndex];
  const doneCount = milestones.filter((m) => m.done && !m.current).length;
  const pct = Math.round(((doneCount + (current?.current ? 0.4 : 0)) / milestones.length) * 100);

  return (
    <div className="mb-1">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pvg-muted)]">
            Current stage
          </p>
          <p className="mt-0.5 text-base font-semibold text-[var(--pvg-primary)]">
            {current?.label ?? 'Order progress'}
          </p>
        </div>
        <p className="pb-0.5 text-[11px] tabular-nums text-[var(--pvg-muted)]">
          {Math.min(activeIndex + 1, milestones.length)} / {milestones.length}
        </p>
      </div>
      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-[#efe8dc]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Order progress"
      >
        <div
          className="h-full rounded-full bg-[var(--pvg-accent)] transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(6, pct))}%` }}
        />
      </div>
      {current?.description ? (
        <p className="mt-2.5 text-[13px] leading-relaxed text-[#6b5b4e]">{current.description}</p>
      ) : null}
    </div>
  );
}

export function OrderJourneyTimeline({
  compact = false,
  orderId,
  ...order
}: OrderJourneyTimelineProps) {
  const journey = getCustomerJourney(order);
  if (!journey) return null;

  const { milestones, activeIndex, hasTracking, fulfillmentContext, deliveryFailed, deliveryProof } =
    journey;

  return (
    <div
      className={`font-body ${compact ? 'px-0 py-3' : 'px-5 py-4 md:px-6'}`}
      style={{ fontFamily: "var(--font-roboto), 'Roboto', Arial, sans-serif" }}
    >
      <div className="rounded-2xl border border-[#ebe3d4] bg-gradient-to-b from-[#fffdf9] to-[#f7f2ea] p-4 sm:p-5">
        <ProgressHeader milestones={milestones} activeIndex={activeIndex} />

        {deliveryFailed ? (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Delivery failed</p>
              <p className="mt-0.5 text-[12px] text-red-800/90">
                Please update your delivery address from order details or contact support. We will
                schedule out for delivery again.
              </p>
            </div>
          </div>
        ) : null}

        <ol className="relative mt-5 ms-2.5 border-s border-[#e5dccf] ps-5">
          {milestones.map((milestone) => {
            const active = milestone.done || milestone.current;
            const isCurrent = milestone.current;
            const isDone = milestone.done && !milestone.current;

            return (
              <li
                key={milestone.key}
                className={`relative pb-4 last:pb-0 ${
                  isCurrent ? '-ms-2 rounded-xl bg-[rgba(138,100,0,0.07)] px-2 py-2.5 ps-2' : ''
                }`}
              >
                <span
                  className="absolute flex h-[18px] w-[18px] items-center justify-center rounded-full"
                  style={{
                    left: isCurrent ? '-1.7rem' : '-1.45rem',
                    top: isCurrent ? '0.7rem' : '0.15rem',
                    background: active ? 'var(--pvg-accent)' : '#fff',
                    border: active ? 'none' : '1.5px solid #d9cebe',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(138, 100, 0, 0.12)' : undefined,
                  }}
                  aria-hidden="true"
                >
                  {isDone ? (
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
                  ) : isCurrent ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p
                    className={`text-[13px] ${isCurrent ? 'font-semibold' : 'font-medium'}`}
                    style={{
                      color: isCurrent
                        ? 'var(--pvg-primary)'
                        : isDone
                          ? '#5c4f42'
                          : '#9a8b7a',
                    }}
                  >
                    {milestone.label}
                  </p>
                  {isCurrent ? (
                    <span className="rounded-full bg-[rgba(138,100,0,0.14)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8a6400]">
                      In progress
                    </span>
                  ) : null}
                  {isDone ? (
                    <span className="text-[10px] font-medium text-[#2f7a4a]">Done</span>
                  ) : null}
                  {milestone.detail && (isCurrent || milestone.key === 'shipped') ? (
                    <span className="text-[11px] text-[var(--pvg-muted)]">· {milestone.detail}</span>
                  ) : null}
                </div>

                {!isDone && !isCurrent ? (
                  <p className="mt-0.5 text-[12px] leading-snug text-[#a89888]">
                    {milestone.description}
                  </p>
                ) : null}

                {(milestone.videoUrls?.length
                  ? milestone.videoUrls
                  : milestone.videoUrl
                    ? [milestone.videoUrl]
                    : []
                ).map((url, index, list) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#8a6400] underline-offset-2 hover:underline"
                  >
                    <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    {list.length > 1 ? `Watch video ${index + 1}` : 'Watch video'}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ))}

                {milestone.imageUrls && milestone.imageUrls.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {milestone.imageUrls.map((url, index) => {
                      const href =
                        milestone.key === 'delivered' && orderId && !/^https?:/i.test(url)
                          ? deliveryProofProxyUrl(orderId, index)
                          : url;
                      return (
                        <a
                          key={`${url}-${index}`}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block h-14 w-14 overflow-hidden rounded-lg border border-[#e5dccf] bg-white"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={href}
                            alt={`${milestone.label} ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </a>
                      );
                    })}
                    <span className="flex items-center gap-1 text-[11px] text-[var(--pvg-muted)]">
                      <ImageIcon className="h-3 w-3" aria-hidden="true" />
                      Photos
                    </span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-3 space-y-3">
        {fulfillmentContext.mixed ? (
          <p className="text-[11px] text-[var(--pvg-muted)]">
            Tracking reflects the primary fulfillment path for this order.
          </p>
        ) : null}

        {hasTracking ? (
          <div className="rounded-2xl border border-[#ebe3d4] bg-white px-4 py-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pvg-muted)]">
                  <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                  Shipment tracking
                </p>
                {order.carrier ? (
                  <p className="mt-1.5 text-[13px] text-[var(--pvg-text)]">
                    Carrier: <span className="font-semibold">{order.carrier}</span>
                  </p>
                ) : null}
                {order.tracking_number ? (
                  <p className="mt-0.5 text-sm font-semibold text-[var(--pvg-primary)]">
                    {order.tracking_number}
                  </p>
                ) : null}
                {order.shipped_at ? (
                  <p className="mt-1 text-[12px] text-[var(--pvg-muted)]">
                    Shipped: {formatDeliveryDate(order.shipped_at)}
                  </p>
                ) : null}
                {order.estimated_delivery ? (
                  <p className="mt-0.5 text-[12px] text-[var(--pvg-muted)]">
                    Est. delivery: {formatDeliveryDate(order.estimated_delivery)}
                  </p>
                ) : null}
              </div>
              {order.tracking_url ? (
                <Link
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition hover:opacity-90"
                  style={{ background: 'var(--pvg-primary)' }}
                >
                  Track package
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
            {deliveryProof?.details ? (
              <p className="mt-3 border-t border-[#efe8dc] pt-3 text-[12px] text-[#6b5b4e]">
                {deliveryProof.details}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
