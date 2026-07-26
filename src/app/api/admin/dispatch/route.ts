import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

/** Stages Parcel Dispatch watches day-to-day */
export const DISPATCH_STAGES = [
  { status: 'quality_check', label: 'Ready to ship (QC)' },
  { status: 'shipped', label: 'Shipped / in transit' },
  { status: 'out_for_delivery', label: 'Out for delivery' },
  { status: 'delivered', label: 'Delivered' },
  { status: 'feedback', label: 'Feedback' },
] as const;

/**
 * GET /api/admin/dispatch
 * Open-order counts for the Parcel Dispatch board.
 */
export async function GET() {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const supabase = createAdminClient();
  const counts = await Promise.all(
    DISPATCH_STAGES.map(async (stage) => {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', stage.status);
      if (error) throw error;
      return { ...stage, count: count ?? 0 };
    }),
  );

  return NextResponse.json({
    stages: counts,
    totalOpen: counts.reduce((sum, row) => sum + row.count, 0),
  });
}
