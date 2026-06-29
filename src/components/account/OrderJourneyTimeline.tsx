import Link from 'next/link';
import { ExternalLink, PlayCircle, Truck } from 'lucide-react';
import {
  getCustomerJourney,
  type CustomerJourneyInput,
} from '@/lib/orders/customer-journey';

type OrderJourneyTimelineProps = CustomerJourneyInput & {
  compact?: boolean;
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

export function OrderJourneyTimeline({
  compact = false,
  ...order
}: OrderJourneyTimelineProps) {
  const journey = getCustomerJourney(order);
  if (!journey) return null;

  const { milestones, hasTracking } = journey;

  return (
    <div className={compact ? 'px-0 py-3' : 'px-6 py-4'}>
      <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        <div className="flex min-w-[720px] items-center">
          {milestones.map((milestone, index) => (
            <div key={milestone.key} className="flex flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center px-0.5">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
                  style={{
                    background:
                      milestone.done || milestone.current
                        ? 'var(--pvg-accent)'
                        : 'var(--pvg-bg-alt)',
                    color:
                      milestone.done || milestone.current
                        ? 'white'
                        : 'var(--pvg-muted)',
                    border:
                      milestone.done || milestone.current
                        ? 'none'
                        : '2px solid var(--pvg-border)',
                  }}
                >
                  {milestone.done && !milestone.current ? '✓' : index + 1}
                </div>
                <span
                  className="mt-1 max-w-[4.5rem] truncate text-center text-[8px] font-semibold uppercase tracking-wide sm:max-w-none sm:text-[9px]"
                  style={{
                    color:
                      milestone.done || milestone.current
                        ? 'var(--pvg-primary)'
                        : 'var(--pvg-muted)',
                    fontWeight: milestone.current ? 700 : 400,
                  }}
                  title={milestone.label}
                >
                  <span className="sm:hidden">{milestone.shortLabel}</span>
                  <span className="hidden sm:inline">{milestone.label}</span>
                </span>
                {milestone.detail && (milestone.current || milestone.done) ? (
                  <span className="mt-0.5 max-w-[5rem] text-center text-[7px] normal-case text-[var(--pvg-muted)] sm:max-w-none sm:text-[8px]">
                    {milestone.detail}
                  </span>
                ) : null}
              </div>
              {index < milestones.length - 1 ? (
                <div
                  className="mb-4 h-0.5 flex-1"
                  style={{
                    background: milestone.done
                      ? 'var(--pvg-accent)'
                      : 'var(--pvg-border)',
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {milestones
          .filter((milestone) => milestone.videoUrl)
          .map((milestone) => (
            <a
              key={milestone.key}
              href={milestone.videoUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-[#ede6d5] bg-[#faf8f4] px-4 py-3 transition hover:border-[#c9a84c] hover:bg-[#fff8e6]"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--pvg-primary)]">
                <PlayCircle className="h-4 w-4 shrink-0 text-[#b8861e]" aria-hidden="true" />
                Watch {milestone.label}
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--pvg-muted)]" aria-hidden="true" />
            </a>
          ))}

        {hasTracking ? (
          <div className="rounded-lg border border-[#ede6d5] bg-white px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--pvg-muted)]">
                  <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                  Shipment tracking
                </p>
                {order.carrier ? (
                  <p className="mt-1 text-sm text-[var(--pvg-text)]">
                    Carrier: <span className="font-semibold">{order.carrier}</span>
                  </p>
                ) : null}
                {order.tracking_number ? (
                  <p className="mt-0.5 text-sm font-semibold text-[var(--pvg-primary)]">
                    {order.tracking_number}
                  </p>
                ) : null}
                {order.estimated_delivery ? (
                  <p className="mt-1 text-xs text-[var(--pvg-muted)]">
                    Est. delivery: {formatDeliveryDate(order.estimated_delivery)}
                  </p>
                ) : null}
              </div>
              {order.tracking_url ? (
                <Link
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'var(--pvg-primary)',
                    color: 'var(--pvg-bg)',
                  }}
                >
                  Track package
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
