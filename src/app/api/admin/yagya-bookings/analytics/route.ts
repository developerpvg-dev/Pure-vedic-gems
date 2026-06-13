import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown, buildDailyTrend } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('yagya_bookings')
    .select('status, payment_status, amount_inr, created_at')
    .limit(5000);

  if (error) return NextResponse.json({ error: 'Failed to load yagya analytics' }, { status: 500 });

  const rows = (data ?? []).map((row) => ({
    ...row,
    total: Number(row.amount_inr ?? 0),
    payment_status: row.payment_status ?? 'unknown',
  }));

  const captured = rows.filter((row) => row.payment_status === 'captured');
  const capturedRevenue = captured.reduce((sum, row) => sum + row.total, 0);

  return NextResponse.json({
    summary: {
      totalBookings: rows.length,
      capturedPayments: captured.length,
      pendingPayments: rows.filter((row) => row.payment_status === 'pending').length,
      capturedRevenue,
      avgBookingValue: captured.length ? Math.round(capturedRevenue / captured.length) : 0,
      completedServices: rows.filter((row) => ['completed', 'performed'].includes(row.status ?? '')).length,
    },
    trend: buildDailyTrend(rows, 30),
    statusBreakdown: buildBreakdown(rows, 'status'),
    paymentBreakdown: buildBreakdown(rows, 'payment_status'),
  });
}
