import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { RecordOrderPaymentSchema } from '@/lib/validators/order';
import { applyPaymentToBalances, inferPaymentKind } from '@/lib/orders/counter-payments';
import { logAdminAction } from '@/lib/utils/admin-log';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

/**
 * GET /api/admin/orders/[id]/payments — payment ledger
 * POST /api/admin/orders/[id]/payments — record advance / balance
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const db = asUntypedSupabase(createAdminClient());

  const { data, error } = await db
    .from('order_payments')
    .select('*')
    .eq('order_id', id)
    .order('paid_at', { ascending: true });

  if (error) {
    const detail = String(error.message ?? '');
    if (detail.includes('order_payments') || detail.includes('does not exist')) {
      return NextResponse.json({ payments: [], needsMigration: true });
    }
    return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 });
  }

  return NextResponse.json({ payments: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = RecordOrderPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);

  const { data: order, error: orderError } = await db
    .from('orders')
    .select('id, order_number, total, amount_paid, amount_due, payment_status, status')
    .eq('id', id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const row = order as {
    id: string;
    order_number: string;
    total: number;
    amount_paid: number | null;
    amount_due: number | null;
    payment_status: string;
    status: string;
  };

  if (['cancelled', 'refunded'].includes(row.status)) {
    return NextResponse.json({ error: 'Cannot record payment on a cancelled/refunded order.' }, { status: 400 });
  }

  const priorPaid = Number(row.amount_paid ?? 0);
  let balances;
  try {
    balances = applyPaymentToBalances(Number(row.total), priorPaid, parsed.data.amount);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid payment';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const kind =
    parsed.data.kind ?? inferPaymentKind(parsed.data.amount, Number(row.total), priorPaid);

  const { data: payment, error: payError } = await db
    .from('order_payments')
    .insert({
      order_id: id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      kind,
      reference: parsed.data.reference || null,
      notes: parsed.data.notes || null,
      recorded_by: auth.user.id,
      paid_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (payError || !payment) {
    console.error('[admin/orders/payments]', payError);
    return NextResponse.json(
      {
        error: String(payError?.message ?? '').includes('order_payments')
          ? 'Run supabase/week40_offline_orders.sql to enable the payment ledger.'
          : 'Failed to record payment.',
      },
      { status: 500 },
    );
  }

  const { error: updateError } = await db
    .from('orders')
    .update({
      amount_paid: balances.amount_paid,
      amount_due: balances.amount_due,
      payment_status: balances.payment_status,
      payment_method: parsed.data.method,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('[admin/orders/payments] order update', updateError);
    return NextResponse.json({ error: 'Payment saved but order balances failed to update.' }, { status: 500 });
  }

  await db.from('order_tracking_events').insert({
    order_id: id,
    status: row.status,
    note: `Payment recorded: ${kind} ₹${parsed.data.amount} via ${parsed.data.method}. Due now ₹${balances.amount_due}.`,
    is_customer_visible: true,
    created_by: auth.user.id,
  });

  await logAdminAction({
    userId: auth.user.id,
    action: 'order_payment_record',
    resourceType: 'order',
    resourceId: id,
    details: {
      order_number: row.order_number,
      amount: parsed.data.amount,
      method: parsed.data.method,
      kind,
      amount_paid: balances.amount_paid,
      amount_due: balances.amount_due,
    },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({
    payment,
    amount_paid: balances.amount_paid,
    amount_due: balances.amount_due,
    payment_status: balances.payment_status,
  });
}
