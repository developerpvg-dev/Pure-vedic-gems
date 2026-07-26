import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { mergeComplianceFlags, parseComplianceFlags } from '@/lib/orders/returns';

/**
 * POST /api/orders/[id]/receipt
 * Customer confirms whether a delivered order was received properly.
 * Body: { ok: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to confirm delivery' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.ok !== 'boolean') {
    return NextResponse.json({ error: 'Please confirm whether the product was received properly' }, { status: 400 });
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: order, error } = await db
    .from('orders')
    .select('id, status, customer_id, compliance_flags')
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const orderRow = order as {
    id: string;
    status: string;
    customer_id: string | null;
    compliance_flags: unknown;
  };

  if (orderRow.customer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (orderRow.status !== 'delivered' && orderRow.status !== 'feedback') {
    return NextResponse.json({ error: 'Confirmation is only available after delivery' }, { status: 400 });
  }

  const flags = parseComplianceFlags(orderRow.compliance_flags);
  if (flags.receipt_confirmed) {
    return NextResponse.json({
      success: true,
      receipt_ok: Boolean(flags.receipt_ok),
      already_confirmed: true,
    });
  }

  const now = new Date().toISOString();
  const compliance_flags = mergeComplianceFlags(flags, {
    receipt_confirmed: true,
    receipt_ok: body.ok,
    receipt_confirmed_at: now,
  });

  const { error: updateError } = await db
    .from('orders')
    .update({ compliance_flags })
    .eq('id', id);

  if (updateError) {
    console.error('[orders/receipt]', updateError);
    return NextResponse.json({ error: 'Could not save confirmation' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    receipt_ok: body.ok,
    already_confirmed: false,
  });
}
