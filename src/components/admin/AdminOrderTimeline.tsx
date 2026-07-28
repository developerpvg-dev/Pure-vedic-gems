'use client';

import { Clock } from 'lucide-react';
import {
  buildAdminOrderTimeline,
  formatTimelineDate,
  type TrackingEventRow,
} from '@/lib/orders/admin-timeline';

type AdminOrderTimelineProps = {
  createdAt: string;
  statusLabels: Record<string, string>;
  events?: TrackingEventRow[];
  designCompletedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  productsMarkedSoldAt?: string | null;
  paymentVerifiedAt?: string | null;
  currentStatus: string;
};

export function AdminOrderTimeline({
  createdAt,
  statusLabels,
  events = [],
  designCompletedAt,
  shippedAt,
  deliveredAt,
  productsMarkedSoldAt,
  paymentVerifiedAt,
  currentStatus,
}: AdminOrderTimelineProps) {
  const entries = buildAdminOrderTimeline({
    createdAt,
    statusLabels,
    events,
    designCompletedAt,
    shippedAt,
    deliveredAt,
    productsMarkedSoldAt,
    paymentVerifiedAt,
  });

  if (!entries.length) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3.5">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        Order timeline
      </p>
      <ol className="relative ms-2 max-h-64 space-y-0 overflow-y-auto border-s border-stone-200 ps-4">
        {entries.map((entry, index) => {
          const isLatest = index === entries.length - 1;
          const isCurrent = entry.key === currentStatus;
          return (
            <li key={`${entry.key}-${entry.at}`} className="relative pb-3 last:pb-0">
              <span
                className={`absolute -start-[1.3rem] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-stone-50 ${
                  isCurrent || isLatest ? 'bg-stone-900' : 'bg-stone-300'
                }`}
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p
                  className={`text-[13px] ${
                    isCurrent ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'
                  }`}
                >
                  {entry.label}
                  {isCurrent ? (
                    <span className="ml-2 rounded-full bg-stone-900 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
                      Now
                    </span>
                  ) : null}
                </p>
                <time
                  dateTime={entry.at}
                  className="shrink-0 text-[11px] tabular-nums text-stone-500"
                >
                  {formatTimelineDate(entry.at)}
                </time>
              </div>
              {entry.note ? (
                <p className="mt-0.5 text-[11px] leading-snug text-stone-400">{entry.note}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
