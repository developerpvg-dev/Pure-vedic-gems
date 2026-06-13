'use client';

import type { ComponentType } from 'react';

export type TrendPoint = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
  capturedRevenue?: number;
};

export function fmtInr(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

const CHART_HEIGHT = 128;

export function RevenueTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        No orders in this period
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((point) => point.capturedRevenue ?? point.revenue), 1);
  const maxOrders = Math.max(...data.map((point) => point.orders), 1);
  const barWidth = Math.max(44, Math.min(72, Math.floor(640 / Math.max(data.length, 1))));

  return (
    <div className="space-y-3">
      <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div
          className="flex items-end gap-2 px-1"
          style={{ minWidth: '100%', width: `${Math.max(data.length * (barWidth + 8), 320)}px`, height: CHART_HEIGHT + 40 }}
        >
          {data.map((point) => {
            const revenueHeight = Math.max(((point.capturedRevenue ?? point.revenue) / maxRevenue) * CHART_HEIGHT, 4);
            const orderHeight = Math.max((point.orders / maxOrders) * CHART_HEIGHT, 4);

            return (
              <div
                key={point.date}
                className="flex shrink-0 flex-col items-center justify-end gap-1.5"
                style={{ width: barWidth }}
              >
                <span className="text-[10px] font-semibold tabular-nums text-gray-500">
                  {point.orders > 0 ? point.orders : ''}
                </span>
                <div className="flex w-full items-end justify-center gap-1" style={{ height: CHART_HEIGHT }}>
                  <div
                    className="w-[46%] rounded-t-md bg-amber-400 transition-colors hover:bg-amber-500"
                    style={{ height: revenueHeight }}
                    title={`${point.label}: ${fmtInr(point.capturedRevenue ?? point.revenue)} revenue`}
                  />
                  <div
                    className="w-[46%] rounded-t-md bg-sky-300 transition-colors hover:bg-sky-400"
                    style={{ height: orderHeight }}
                    title={`${point.label}: ${point.orders} orders`}
                  />
                </div>
                <span className="max-w-full truncate text-center text-[10px] leading-tight text-gray-500" title={point.label}>
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
          Captured revenue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-300" />
          Order volume
        </span>
      </div>
    </div>
  );
}

export function MetricBars({
  title,
  icon: Icon,
  items,
  emptyLabel = 'No data yet',
  valueSuffix = '',
  embedded = false,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  items: { label: string; value: number; meta?: number | string }[];
  emptyLabel?: string;
  valueSuffix?: string;
  embedded?: boolean;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className={embedded ? '' : 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'}>
      <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        <Icon className="h-4 w-4 text-amber-600" />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-3 py-6 text-center text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const width = Math.max((item.value / max) * 100, 6);
            const metaText = typeof item.meta === 'number' ? fmtInr(item.meta) : item.meta;
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-gray-700">{item.label}</span>
                  <span className="shrink-0 font-bold tabular-nums text-gray-900">
                    {item.value.toLocaleString('en-IN')}
                    {valueSuffix}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${width}%` }} />
                </div>
                {metaText ? <p className="mt-1 text-xs text-gray-400">{metaText} total</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  bg,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  bg: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${tone}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{value}</p>
          {subtext ? <p className="mt-0.5 text-xs text-gray-400">{subtext}</p> : null}
        </div>
      </div>
    </div>
  );
}
