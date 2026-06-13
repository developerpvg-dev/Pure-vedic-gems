import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('certification_labs')
    .select('name, extra_charge, turnaround_days, is_default, is_active, created_at')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load certification analytics' }, { status: 500 });

  const rows = data ?? [];
  const active = rows.filter((row) => row.is_active);
  const charges = rows.map((row) => Number(row.extra_charge ?? 0));
  const turnarounds = rows.map((row) => Number(row.turnaround_days ?? 0)).filter((value) => value > 0);

  return NextResponse.json({
    summary: {
      totalLabs: rows.length,
      activeLabs: active.length,
      defaultLabs: rows.filter((row) => row.is_default).length,
      avgExtraCharge: charges.length ? Math.round(charges.reduce((sum, value) => sum + value, 0) / charges.length) : 0,
      avgTurnaroundDays: turnarounds.length ? Math.round(turnarounds.reduce((sum, value) => sum + value, 0) / turnarounds.length) : 0,
    },
    chargeBreakdown: rows
      .map((row) => ({ label: row.name, value: Number(row.extra_charge ?? 0), meta: Number(row.turnaround_days ?? 0) }))
      .sort((a, b) => b.value - a.value),
    statusBreakdown: [
      { label: 'Active', value: active.length, meta: 0 },
      { label: 'Inactive', value: rows.length - active.length, meta: 0 },
      { label: 'Default', value: rows.filter((row) => row.is_default).length, meta: 0 },
    ],
    turnaroundBreakdown: buildBreakdown(
      rows.map((row) => ({ turnaround: row.turnaround_days ? `${row.turnaround_days} days` : 'Unknown', total: row.extra_charge })),
      'turnaround'
    ),
  });
}
