export function titleize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function fmtInr(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function buildBreakdown<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T,
  labels: Record<string, string> = {}
) {
  const counts = new Map<string, { count: number; total: number }>();
  for (const row of rows) {
    const raw = row[key];
    const value = typeof raw === 'string' && raw.trim() ? raw.trim() : 'unknown';
    const bucket = counts.get(value) ?? { count: 0, total: 0 };
    bucket.count += 1;
    const amount = Number(row.total ?? row.amount_inr ?? row.amount ?? 0);
    if (Number.isFinite(amount)) bucket.total += amount;
    counts.set(value, bucket);
  }
  return Array.from(counts.entries())
    .map(([value, stats]) => ({
      label: labels[value] ?? titleize(value),
      value: stats.count,
      meta: stats.total,
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildDailyTrend(
  rows: Array<{ created_at: string; total?: number; amount_inr?: number | null; payment_status?: string }>,
  days = 30
) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(d.toISOString().split('T')[0], { orders: 0, revenue: 0 });
  }

  for (const row of rows) {
    const key = row.created_at.split('T')[0];
    if (!buckets.has(key)) continue;
    const bucket = buckets.get(key)!;
    bucket.orders += 1;
    const amount = Number(row.total ?? row.amount_inr ?? 0);
    if (row.payment_status === undefined || row.payment_status === 'captured') {
      bucket.revenue += Number.isFinite(amount) ? amount : 0;
    }
  }

  return Array.from(buckets.entries()).map(([date, values]) => {
    const labelDate = new Date(`${date}T00:00:00`);
    return {
      date,
      label: labelDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      orders: values.orders,
      revenue: values.revenue,
      capturedRevenue: values.revenue,
    };
  });
}

export function buildRatingBreakdown(rows: Array<{ rating: number | null }>) {
  const counts = new Map<number, number>();
  for (let i = 1; i <= 5; i += 1) counts.set(i, 0);
  for (const row of rows) {
    const rating = Math.round(Number(row.rating ?? 0));
    if (rating >= 1 && rating <= 5) counts.set(rating, (counts.get(rating) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([rating, value]) => ({ label: `${rating} star`, value, meta: 0, rating }))
    .sort((a, b) => b.rating - a.rating)
    .map(({ label, value, meta }) => ({ label, value, meta }));
}

export function resolveDateRange(from?: string | null, to?: string | null, period?: string | null) {
  if (from || to) {
    return {
      from: from ? new Date(`${from}T00:00:00.000Z`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59.999Z`).toISOString() : undefined,
    };
  }
  if (!period || period === 'all') return { from: undefined, to: undefined };
  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return { from: start.toISOString(), to: undefined };
}
