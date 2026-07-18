import Link from 'next/link';
import { Check, ExternalLink, PlayCircle, Truck } from 'lucide-react';
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

function stageStateLabel(done: boolean, current: boolean) {
  if (done && !current) return 'Completed';
  if (current) return done ? 'In progress' : 'Current stage';
  return 'Upcoming';
}

export function OrderJourneyTimeline({
  compact = false,
  ...order
}: OrderJourneyTimelineProps) {
  const journey = getCustomerJourney(order);
  if (!journey) return null;

  const { milestones, hasTracking, fulfillmentContext } = journey;
  const minWidth = Math.max(360, milestones.length * 88);

  return (
    <div className={compact ? 'px-0 py-3' : 'px-6 py-4'}>
      <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        <div className="flex items-center" style={{ minWidth: `${minWidth}px` }}>
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

      <ol className="mt-5 space-y-0 rounded-xl border border-[#ede6d5] bg-[#faf8f4] px-3 py-2 sm:px-4">
        {milestones.map((milestone, index) => {
          const state = stageStateLabel(milestone.done, milestone.current);
          const active = milestone.done || milestone.current;
          const rowClass =
            index < milestones.length - 1
              ? 'flex gap-3 border-b border-[#ede6d5] py-3'
              : 'flex gap-3 py-3';
          return (
            <li key={`detail-${milestone.key}`} className={rowClass}>
              <div
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  background: active ? 'var(--pvg-accent)' : 'white',
                  color: active ? 'white' : 'var(--pvg-muted)',
                  border: active ? 'none' : '1.5px solid var(--pvg-border)',
                }}
                aria-hidden="true"
              >
                {milestone.done && !milestone.current ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: active ? 'var(--pvg-primary)' : 'var(--pvg-muted)' }}
                  >
                    {milestone.label}
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      background: milestone.current
                        ? 'rgba(138, 100, 0, 0.12)'
                        : milestone.done
                          ? 'rgba(22, 101, 52, 0.1)'
                          : 'rgba(0,0,0,0.04)',
                      color: milestone.current
                        ? '#8a6400'
                        : milestone.done
                          ? '#166534'
                          : '#7a6250',
                    }}
                  >
                    {state}
                  </span>
                  {milestone.detail ? (
                    <span className="text-[11px] text-[var(--pvg-muted)]">
                      · {milestone.detail}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#6b5b4e]">
                  {milestone.description}
                </p>
                {milestone.videoUrl ? (
                  <a
                    href={milestone.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8a6400] underline-offset-2 hover:underline"
                  >
                    <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Watch {milestone.label}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 space-y-3">
        {fulfillmentContext.mixed ? (
          <p className="text-[11px] text-[var(--pvg-muted)]">
            Tracking reflects the primary fulfillment path for this order.
          </p>
        ) : null}

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
