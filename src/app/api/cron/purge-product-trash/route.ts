import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { purgeExpiredTrashedProducts } from '@/lib/products/trash';
import { reconcilePendingRazorpayOrders } from '@/lib/orders/reconcile-razorpay';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const purged = await purgeExpiredTrashedProducts(asUntypedSupabase(createAdminClient()));
    const razorpay = await reconcilePendingRazorpayOrders().catch((error) => {
      console.error('reconcile-razorpay:', error);
      return { checked: 0, finalized: 0, mismatched: 0, error: true };
    });
    return NextResponse.json({ ok: true, purged, razorpay });
  } catch (err) {
    console.error('purge-product-trash:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Purge failed' },
      { status: 500 }
    );
  }
}
