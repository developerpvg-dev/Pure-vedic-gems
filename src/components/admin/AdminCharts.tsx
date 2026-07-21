'use client';

import type { ComponentType, ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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

export function fmtInrCompact(value: number) {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(2)} L`;
  return fmtInr(value);
}

const COLORS = {
  amber: '#f59e0b',
  amberSoft: '#fbbf24',
  sky: '#38bdf8',
  emerald: '#10b981',
  emeraldSoft: '#34d399',
  grid: '#f3f4f6',
  axis: '#9ca3af',
} as const;

const METRIC_PALETTE = ['#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e', '#14b8a6', '#f97316', '#6366f1'];

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
};

function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  formatValue?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      {label != null && label !== '' ? <p className="mb-1.5 text-xs font-semibold text-gray-700">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((entry) => {
          const name = String(entry.name ?? entry.dataKey ?? '');
          const raw = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0);
          return (
            <div key={name} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }} />
              <span className="text-gray-500">{name}</span>
              <span className="ml-auto font-semibold tabular-nums text-gray-900">
                {formatValue ? formatValue(raw, name) : raw.toLocaleString('en-IN')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
      {children}
    </div>
  );
}

const axisTick = { fill: COLORS.axis, fontSize: 10 } as const;

/** Single-series revenue bars — used on the main dashboard (last 7 days). */
export function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  if (data.length === 0) {
    return <ChartEmpty>No revenue in this period</ChartEmpty>;
  }

  const rows = data.map((day) => {
    const dateObj = new Date(day.date);
    return {
      ...day,
      label: dateObj.toLocaleDateString('en-IN', { weekday: 'short' }),
    };
  });

  return (
    <div className="h-44 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
          <YAxis
            tick={{ fill: COLORS.axis, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: 'rgba(245, 158, 11, 0.08)' }}
            content={
              <ChartTooltip
                formatValue={(value, name) => (name === 'Orders' ? String(value) : fmtInr(value))}
              />
            }
          />
          <Bar dataKey="revenue" name="Revenue" fill={COLORS.amber} radius={[6, 6, 0, 0]} maxBarSize={40} />
          <Bar dataKey="orders" name="Orders" fill={COLORS.sky} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SignupTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return <ChartEmpty>No signup data for this period</ChartEmpty>;
  }

  const totalSignups = data.reduce((sum, point) => sum + point.orders, 0);
  const peakSignups = Math.max(...data.map((point) => point.orders), 0);
  const peakDay = data.find((point) => point.orders === peakSignups && peakSignups > 0);
  const activeDays = data.filter((point) => point.orders > 0).length;

  if (totalSignups === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-5">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-3xl font-bold tabular-nums text-gray-300">0</p>
          <p className="mt-2 text-sm font-medium text-gray-700">No new signups in the last 30 days</p>
          <p className="mt-1 text-xs text-gray-500">The chart will populate when customers register.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-100 bg-gradient-to-b from-emerald-50/40 to-white p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total signups</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">{totalSignups}</p>
        </div>
        <div className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Peak day</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{peakDay?.label ?? '—'}</p>
          <p className="text-xs tabular-nums text-emerald-700">
            {peakSignups} signup{peakSignups === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Active days</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{activeDays}</p>
        </div>
      </div>

      <div className="h-52 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: COLORS.axis, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: COLORS.emeraldSoft, strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="orders"
              name="Signups"
              stroke={COLORS.emerald}
              strokeWidth={2.5}
              fill="url(#signupFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: COLORS.emerald }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          New customer signups per day
        </span>
      </p>
    </div>
  );
}

export function RevenueTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return <ChartEmpty>No orders in this period</ChartEmpty>;
  }

  const rows = data.map((point) => ({
    ...point,
    revenueValue: point.capturedRevenue ?? point.revenue,
  }));

  return (
    <div className="min-w-0 space-y-3">
      <div className="h-56 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLORS.amber} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.sky} stopOpacity={0.25} />
                <stop offset="100%" stopColor={COLORS.sky} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              yAxisId="revenue"
              tick={{ fill: COLORS.axis, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v: number) => fmtInrCompact(v).replace('₹', '')}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              allowDecimals={false}
              tick={{ fill: COLORS.axis, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              content={
                <ChartTooltip
                  formatValue={(value, name) => (name === 'Order volume' ? String(value) : fmtInr(value))}
                />
              }
              cursor={{ stroke: COLORS.amberSoft, strokeWidth: 1 }}
            />
            <Legend
              verticalAlign="bottom"
              height={28}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: '#6b7280', paddingTop: 4 }}
            />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenueValue"
              name="Captured revenue"
              stroke={COLORS.amber}
              strokeWidth={2.5}
              fill="url(#revenueFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: COLORS.amber }}
            />
            <Area
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              name="Order volume"
              stroke={COLORS.sky}
              strokeWidth={2}
              fill="url(#ordersFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: COLORS.sky }}
            />
          </AreaChart>
        </ResponsiveContainer>
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
  const chartHeight = Math.max(items.length * 36, 120);

  return (
    <div className={embedded ? '' : 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'}>
      <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        <Icon className="h-4 w-4 text-amber-600" />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-3 py-6 text-center text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <div className="w-full min-w-0" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={items}
              layout="vertical"
              margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={110}
                tick={{ fill: '#4b5563', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(245, 158, 11, 0.06)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as { label: string; value: number; meta?: number | string };
                  const metaText = typeof row.meta === 'number' ? fmtInr(row.meta) : row.meta;
                  return (
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                      <p className="text-xs font-semibold text-gray-700">{row.label}</p>
                      <p className="mt-1 text-xs tabular-nums text-gray-600">
                        {row.value.toLocaleString('en-IN')}
                        {valueSuffix}
                      </p>
                      {metaText ? <p className="mt-0.5 text-[11px] text-gray-400">{metaText} total</p> : null}
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18} background={{ fill: '#f3f4f6' }}>
                {items.map((_, index) => (
                  <Cell key={items[index].label} fill={METRIC_PALETTE[index % METRIC_PALETTE.length]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v) => `${Number(v).toLocaleString('en-IN')}${valueSuffix}`}
                  style={{ fill: '#111827', fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
