/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { DESIGN_ORDER_STATUSES } from '@/lib/orders/design-workflow';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { logAdminAction } from '@/lib/utils/admin-log';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('orders.design');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: order, error } = await db
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('assigned_designer_id', auth.user.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('orders.design');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null) as {
    status?: string;
    design_notes?: string;
  } | null;

  const status = body?.status?.trim();
  const designNotes = body?.design_notes;

  if (!status || !(DESIGN_ORDER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${DESIGN_ORDER_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: currentRaw } = await db
    .from('orders')
    .select('id, order_number, status, customer_id, assigned_designer_id')
    .eq('id', id)
    .single();

  const current = currentRaw as {
    id: string;
    order_number: string;
    status: string;
    customer_id: string | null;
    assigned_designer_id: string | null;
  } | null;

  if (!current || current.assigned_designer_id !== auth.user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = { status };
  if (designNotes !== undefined) updates.design_notes = designNotes || null;
  if (status === 'design_completed') {
    updates.design_completed_at = new Date().toISOString();
  }

  const { data: updated, error } = await db
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  const statusLabels: Record<string, string> = {
    design_assigned: 'assigned to designer',
    design_in_progress: 'design in progress',
    design_completed: 'design completed',
  };

  await db.from('order_tracking_events').insert({
    order_id: id,
    status,
    event_time: new Date().toISOString(),
    note:
      status === 'design_completed'
        ? 'Jewelry design completed. Your piece will move to product video next.'
        : `Jewelry design update: ${statusLabels[status] || status}.`,
    created_by: auth.user.id,
    is_customer_visible: true,
  });

  if (current.customer_id && status !== current.status) {
    await createInAppNotifications([
      {
        audience: 'user',
        recipientUserId: current.customer_id,
        type: 'order_status_update',
        title: 'Design update',
        message: `Order ${current.order_number}: ${statusLabels[status] || status.replace(/_/g, ' ')}.`,
        href: '/account/orders',
        entityType: 'order',
        entityId: id,
        metadata: { order_number: current.order_number, status },
      },
      {
        audience: 'admin',
        recipientRole: 'fulfillment',
        type: 'order_status_update',
        title: 'Design status updated',
        message: `Order ${current.order_number} design status: ${status.replace(/_/g, ' ')}.`,
        href: `/admin/orders/${id}`,
        entityType: 'order',
        entityId: id,
        metadata: { order_number: current.order_number, status },
      },
    ]);
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'designer_order_update',
    resourceType: 'order',
    resourceId: id,
    details: { status, design_notes: designNotes ?? null },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ order: updated });
}
