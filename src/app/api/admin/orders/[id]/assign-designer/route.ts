/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { sendDesignerOrderAssignedEmail } from '@/lib/resend/send-team-invite';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { logAdminAction } from '@/lib/utils/admin-log';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null) as { designer_id?: string } | null;
  const designerId = body?.designer_id?.trim();

  if (!designerId) {
    return NextResponse.json({ error: 'designer_id is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: designer } = await admin
    .from('team_members')
    .select('id, name, role, is_active')
    .eq('id', designerId)
    .maybeSingle();

  if (!designer?.is_active || designer.role !== 'designer') {
    return NextResponse.json({ error: 'Invalid or inactive designer' }, { status: 400 });
  }

  const { data: orderRaw } = await db
    .from('orders')
    .select('id, order_number, status, customer_id, guest_email, guest_name, assigned_designer_id')
    .eq('id', id)
    .single();

  const order = orderRaw as {
    id: string;
    order_number: string;
    status: string;
    customer_id: string | null;
    guest_email: string | null;
    guest_name: string | null;
    assigned_designer_id: string | null;
  } | null;

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const routableStatuses = new Set(['processing', 'confirmed', 'placed', 'design_assigned', 'design_in_progress']);
  if (!routableStatuses.has(order.status)) {
    return NextResponse.json(
      { error: 'Order can only be routed to a designer after processing has started' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await db
    .from('orders')
    .update({
      assigned_designer_id: designerId,
      design_routed_at: now,
      design_completed_at: null,
      status: 'design_assigned',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[assign-designer] Update error:', error);
    const detail = error.message || 'Database update failed';
    const hint = detail.includes('orders_status') || detail.includes('check constraint')
      ? ' Run supabase/week25_design_order_statuses.sql in Supabase.'
      : '';
    return NextResponse.json(
      { error: `Failed to assign designer: ${detail}${hint}` },
      { status: 500 },
    );
  }

  await db.from('order_tracking_events').insert({
    order_id: id,
    status: 'design_assigned',
    event_time: now,
    note: `Jewelry design assigned to ${designer.name}.`,
    created_by: auth.user.id,
    is_customer_visible: true,
  });

  const { data: designerUser } = await admin.auth.admin.getUserById(designerId);
  const designerEmail = designerUser?.user?.email;

  const siteBase = process.env.EMAIL_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const orderUrl = `${siteBase.replace(/\/$/, '')}/admin/designer/orders/${id}`;

  if (designerEmail) {
    await sendDesignerOrderAssignedEmail({
      to: designerEmail,
      designerName: designer.name,
      orderNumber: order.order_number,
      orderUrl,
    });
  }

  await createInAppNotifications([
    {
      audience: 'user' as const,
      recipientUserId: designerId,
      type: 'order_design_assigned',
      title: 'New design assignment',
      message: `Order ${order.order_number} has been assigned to you for jewelry design.`,
      href: `/admin/designer/orders/${id}`,
      entityType: 'order',
      entityId: id,
      metadata: { order_number: order.order_number },
    },
    ...(order.customer_id
      ? [{
          audience: 'user' as const,
          recipientUserId: order.customer_id,
          type: 'order_status_update' as const,
          title: 'Jewelry design started',
          message: `Your order ${order.order_number} is now with our jewelry designer.`,
          href: '/account/orders',
          entityType: 'order' as const,
          entityId: id,
          metadata: { order_number: order.order_number, status: 'design_assigned' },
        }]
      : []),
  ]);

  await logAdminAction({
    userId: auth.user.id,
    action: 'order_designer_assigned',
    resourceType: 'order',
    resourceId: id,
    details: {
      designer_id: designerId,
      designer_name: designer.name,
      order_number: order.order_number,
    },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ order: updated });
}
