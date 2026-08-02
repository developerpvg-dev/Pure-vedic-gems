export { ORDER_STATUSES } from '@/lib/constants/order-status';

export const PAYMENT_STATUSES = [
  'pending',
  'authorized',
  'captured',
  'partial',
  'failed',
  'refunded',
  'amount_mismatch',
  'cancelled',
] as const;

export const ORDER_PERIOD_PRESETS = ['7d', '30d', '90d', '365d', 'all'] as const;
export type OrderPeriodPreset = (typeof ORDER_PERIOD_PRESETS)[number];

export type AdminOrderFilterState = {
  search: string;
  status: string;
  payment_status: string;
  order_source: string;
  date_from: string;
  date_to: string;
  period: OrderPeriodPreset | '';
  min_total: string;
  max_total: string;
  payment_method: string;
  include_energization: string;
  refund_status: string;
  return_status: string;
  invoice_status: string;
  customer_type: string;
  sort_by: string;
  sort_order: string;
};

export const EMPTY_ADMIN_ORDER_FILTERS: AdminOrderFilterState = {
  search: '',
  status: '',
  payment_status: '',
  order_source: '',
  date_from: '',
  date_to: '',
  period: 'all',
  min_total: '',
  max_total: '',
  payment_method: '',
  include_energization: '',
  refund_status: '',
  return_status: '',
  invoice_status: '',
  customer_type: '',
  sort_by: 'created_at',
  sort_order: 'desc',
};

export type OrderAnalyticsRow = {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  customer_id: string | null;
  order_source?: string | null;
};

export function cleanOrderSearch(value: string) {
  return value.replace(/[%,]/g, ' ').trim();
}

export function parseOptionalNumber(value: string | null | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseOptionalBoolean(value: string | null | undefined) {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return undefined;
}

export function resolvePeriodRange(period: string, dateFrom?: string, dateTo?: string) {
  if (dateFrom || dateTo) {
    return {
      from: dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`).toISOString() : undefined,
      to: dateTo ? new Date(`${dateTo}T23:59:59.999Z`).toISOString() : undefined,
    };
  }

  if (!period || period === 'all') return { from: undefined, to: undefined };

  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '365d' ? 365 : 30;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));
  return { from: from.toISOString(), to: undefined };
}

type OrderQuery = {
  eq: (column: string, value: unknown) => OrderQuery;
  gte: (column: string, value: unknown) => OrderQuery;
  lte: (column: string, value: unknown) => OrderQuery;
  is: (column: string, value: null) => OrderQuery;
  not: (column: string, operator: string, value: null) => OrderQuery;
  or: (filters: string) => OrderQuery;
};

export function applyAdminOrderFilters(
  query: OrderQuery,
  filters: {
    status?: string | null;
    payment_status?: string | null;
    search?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    period?: string | null;
    min_total?: string | null;
    max_total?: string | null;
    payment_method?: string | null;
    include_energization?: string | null;
    refund_status?: string | null;
    return_status?: string | null;
    invoice_status?: string | null;
    customer_type?: string | null;
    order_source?: string | null;
    matchedProfileIds?: string[];
  }
): OrderQuery {
  let nextQuery = query;

  if (filters.status) nextQuery = nextQuery.eq('status', filters.status);
  if (filters.payment_status) nextQuery = nextQuery.eq('payment_status', filters.payment_status);
  if (filters.order_source) nextQuery = nextQuery.eq('order_source', filters.order_source);
  if (filters.payment_method) nextQuery = nextQuery.eq('payment_method', filters.payment_method);
  if (filters.refund_status) nextQuery = nextQuery.eq('refund_status', filters.refund_status);
  if (filters.return_status) nextQuery = nextQuery.eq('return_status', filters.return_status);
  if (filters.invoice_status) nextQuery = nextQuery.eq('invoice_status', filters.invoice_status);

  const energization = parseOptionalBoolean(filters.include_energization ?? undefined);
  if (energization !== undefined) nextQuery = nextQuery.eq('include_energization', energization);

  const minTotal = parseOptionalNumber(filters.min_total ?? undefined);
  const maxTotal = parseOptionalNumber(filters.max_total ?? undefined);
  if (minTotal !== undefined) nextQuery = nextQuery.gte('total', minTotal);
  if (maxTotal !== undefined) nextQuery = nextQuery.lte('total', maxTotal);

  const { from, to } = resolvePeriodRange(filters.period ?? '', filters.date_from ?? undefined, filters.date_to ?? undefined);
  if (from) nextQuery = nextQuery.gte('created_at', from);
  if (to) nextQuery = nextQuery.lte('created_at', to);

  if (filters.customer_type === 'guest') nextQuery = nextQuery.is('customer_id', null);
  if (filters.customer_type === 'registered') nextQuery = nextQuery.not('customer_id', 'is', null);

  if (filters.search) {
    const searchTerm = `%${cleanOrderSearch(filters.search)}%`;
    const clauses = [
      `order_number.ilike.${searchTerm}`,
      `guest_name.ilike.${searchTerm}`,
      `guest_email.ilike.${searchTerm}`,
      `guest_phone.ilike.${searchTerm}`,
    ];
    if (filters.matchedProfileIds?.length) {
      clauses.push(`customer_id.in.(${filters.matchedProfileIds.join(',')})`);
    }
    nextQuery = nextQuery.or(clauses.join(','));
  }

  return nextQuery;
}

export function adminOrderFiltersToParams(filters: AdminOrderFilterState, page: number, limit: number) {
  const params = new URLSearchParams();
  const entries: Array<[string, string]> = [
    ['search', filters.search],
    ['status', filters.status],
    ['payment_status', filters.payment_status],
    ['order_source', filters.order_source],
    ['date_from', filters.date_from],
    ['date_to', filters.date_to],
    ['period', filters.period],
    ['min_total', filters.min_total],
    ['max_total', filters.max_total],
    ['payment_method', filters.payment_method],
    ['include_energization', filters.include_energization],
    ['refund_status', filters.refund_status],
    ['return_status', filters.return_status],
    ['invoice_status', filters.invoice_status],
    ['customer_type', filters.customer_type],
    ['sort_by', filters.sort_by],
    ['sort_order', filters.sort_order],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
  }
  params.set('page', String(page));
  params.set('limit', String(limit));
  return params;
}

export function analyticsParamsFromFilters(filters: AdminOrderFilterState) {
  const params = adminOrderFiltersToParams(filters, 1, 1);
  params.delete('page');
  params.delete('limit');
  params.delete('sort_by');
  params.delete('sort_order');
  return params;
}

function titleize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function bucketKey(dateIso: string, granularity: 'day' | 'week' | 'month') {
  const date = new Date(dateIso);
  if (granularity === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }
  if (granularity === 'week') {
    const day = new Date(date);
    const diff = (day.getDay() + 6) % 7;
    day.setDate(day.getDate() - diff);
    return day.toISOString().split('T')[0];
  }
  return dateIso.split('T')[0];
}

function formatBucketLabel(key: string, granularity: 'day' | 'week' | 'month') {
  const date = new Date(`${key}T00:00:00`);
  if (granularity === 'month') return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  if (granularity === 'week') return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function buildOrderTrendData(rows: OrderAnalyticsRow[], period: string) {
  const granularity: 'day' | 'week' | 'month' =
    period === '365d' || period === 'all' ? 'month' : period === '90d' ? 'week' : 'day';

  const buckets = new Map<string, { orders: number; revenue: number; capturedRevenue: number }>();
  for (const row of rows) {
    const key = bucketKey(row.created_at, granularity);
    const bucket = buckets.get(key) ?? { orders: 0, revenue: 0, capturedRevenue: 0 };
    bucket.orders += 1;
    bucket.revenue += row.total ?? 0;
    if (row.payment_status === 'captured') bucket.capturedRevenue += row.total ?? 0;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      label: formatBucketLabel(date, granularity),
      orders: values.orders,
      revenue: values.revenue,
      capturedRevenue: values.capturedRevenue,
    }));
}

export function buildBreakdown(
  rows: OrderAnalyticsRow[],
  key: 'status' | 'payment_status' | 'payment_method' | 'order_source',
) {
  const counts = new Map<string, { count: number; total: number }>();
  for (const row of rows) {
    const raw =
      key === 'order_source'
        ? row.order_source || 'online'
        : key === 'payment_method'
          ? row.payment_method
          : row[key];
    const value = raw || 'unknown';
    const bucket = counts.get(value) ?? { count: 0, total: 0 };
    bucket.count += 1;
    bucket.total += row.total ?? 0;
    counts.set(value, bucket);
  }

  return Array.from(counts.entries())
    .map(([value, stats]) => ({
      label: titleize(value),
      value: stats.count,
      meta: stats.total,
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildOrderSummary(rows: OrderAnalyticsRow[]) {
  const captured = rows.filter((row) => row.payment_status === 'captured');
  const delivered = rows.filter((row) => row.status === 'delivered');
  const pendingPayment = rows.filter((row) => row.payment_status === 'pending');
  const cancelled = rows.filter((row) => row.status === 'cancelled' || row.status === 'refunded');
  const revenue = captured.reduce((sum, row) => sum + (row.total ?? 0), 0);

  return {
    totalOrders: rows.length,
    totalRevenue: revenue,
    avgOrderValue: captured.length ? Math.round(revenue / captured.length) : 0,
    capturedCount: captured.length,
    deliveredCount: delivered.length,
    pendingPaymentCount: pendingPayment.length,
    cancelledCount: cancelled.length,
    guestCount: rows.filter((row) => !row.customer_id).length,
    registeredCount: rows.filter((row) => Boolean(row.customer_id)).length,
  };
}
