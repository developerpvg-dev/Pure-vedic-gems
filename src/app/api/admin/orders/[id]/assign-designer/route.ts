/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { sendDesignerOrderAssignedEmail } from '@/lib/resend/send-team-invite';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { logAdminAction } from '@/lib/utils/admin-log';

type AssignBody = {
  designer_id?: string;
  designer_name?: string;
  design_price?: number | null;
  design_due_at?: string | null;
  design_slip_notes?: string | null;
  design_metal_estimate?: string | null;
  /** If true, only update slip fields without re-routing */
  slip_only?: boolean;
};

/**
 * POST /api/admin/orders/[id]/assign-designer
 * Assign by portal designer_id and/or workshop designer_name.
 * Also saves work-slip fields (price, due, notes, metal estimate).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as AssignBody | null;

  const designerId = body?.designer_id?.trim() || '';
  let designerName = body?.designer_name?.trim().replace(/\s+/g, ' ') || '';
  const slipOnly = Boolean(body?.slip_only);

  if (!slipOnly && !designerId && !designerName) {
    return NextResponse.json(
      { error: 'Provide a designer name or select a portal designer' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  let portalDesigner: { id: string; name: string } | null = null;
  if (designerId) {
    const { data: designer } = await admin
      .from('team_members')
      .select('id, name, role, is_active')
      .eq('id', designerId)
      .maybeSingle();

    if (!designer?.is_active || designer.role !== 'designer') {
      return NextResponse.json({ error: 'Invalid or inactive portal designer' }, { status: 400 });
    }
    portalDesigner = { id: designer.id as string, name: (designer.name as string) || 'Designer' };
    if (!designerName) designerName = portalDesigner.name;
  }

  // Ensure workshop roster has this name
  if (designerName) {
    const { data: existing } = await db
      .from('workshop_designers')
      .select('id, is_active')
      .ilike('name', designerName)
      .maybeSingle();

    if (existing) {
      const row = existing as { id: string; is_active: boolean };
      if (!row.is_active) {
        await db.from('workshop_designers').update({ is_active: true }).eq('id', row.id);
      }
    } else {
      await db.from('workshop_designers').insert({ name: designerName }).then(null, () => undefined);
    }
  }

  const { data: orderRaw } = await db
    .from('orders')
    .select('id, order_number, status, customer_id, guest_email, guest_name, assigned_designer_id, designer_name')
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
    designer_name: string | null;
  } | null;

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (body?.design_price !== undefined) {
    const price = body.design_price;
    updates.design_price =
      price === null || price === undefined || Number.isNaN(Number(price))
        ? null
        : Number(price);
  }
  if (body?.design_due_at !== undefined) {
    updates.design_due_at = body.design_due_at || null;
  }
  if (body?.design_slip_notes !== undefined) {
    updates.design_slip_notes = body.design_slip_notes?.trim() || null;
  }
  if (body?.design_metal_estimate !== undefined) {
    updates.design_metal_estimate = body.design_metal_estimate?.trim() || null;
  }

  if (!slipOnly) {
    const routableStatuses = new Set([
      'processing',
      'confirmed',
      'placed',
      'design_assigned',
      'design_in_progress',
    ]);
    if (!routableStatuses.has(order.status)) {
      return NextResponse.json(
        { error: 'Order can only be routed to a designer after processing has started' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    updates.designer_name = designerName || null;
    updates.design_routed_at = now;
    updates.design_completed_at = null;
    updates.status = 'design_assigned';
    if (portalDesigner) {
      updates.assigned_designer_id = portalDesigner.id;
    }
  } else if (designerName) {
    updates.designer_name = designerName;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updated, error } = await db
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[assign-designer] Update error:', error);
    const detail = error.message || 'Database update failed';
    const hint =
      detail.includes('design_metal_estimate')
        ? ' Run supabase/week38_design_metal_estimate.sql in Supabase.'
        : detail.includes('designer_name') || detail.includes('design_price') || detail.includes('design_due')
          ? ' Run supabase/week35_workshop_designers.sql in Supabase.'
          : detail.includes('orders_status') || detail.includes('check constraint')
            ? ' Run supabase/week25_design_order_statuses.sql in Supabase.'
            : '';
    return NextResponse.json(
      { error: `Failed to assign designer: ${detail}${hint}` },
      { status: 500 },
    );
  }

  if (!slipOnly) {
    const now = new Date().toISOString();
    await db.from('order_tracking_events').insert({
      order_id: id,
      status: 'design_assigned',
      event_time: now,
      note: `Jewelry design assigned to ${designerName}.`,
      created_by: auth.user.id,
      is_customer_visible: true,
    });

    if (portalDesigner) {
      const { data: designerUser } = await admin.auth.admin.getUserById(portalDesigner.id);
      const designerEmail = designerUser?.user?.email;
      const siteBase =
        process.env.EMAIL_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const orderUrl = `${siteBase.replace(/\/$/, '')}/admin/designer/orders/${id}`;

      if (designerEmail) {
        await sendDesignerOrderAssignedEmail({
          to: designerEmail,
          designerName: portalDesigner.name,
          orderNumber: order.order_number,
          orderUrl,
        });
      }

      await createInAppNotifications([
        {
          audience: 'user' as const,
          recipientUserId: portalDesigner.id,
          type: 'order_design_assigned',
          title: 'New design assignment',
          message: `Order ${order.order_number} has been assigned to you for jewelry design.`,
          href: `/admin/designer/orders/${id}`,
          entityType: 'order',
          entityId: id,
          metadata: { order_number: order.order_number },
        },
        ...(order.customer_id
          ? [
              {
                audience: 'user' as const,
                recipientUserId: order.customer_id,
                type: 'order_status_update' as const,
                title: 'Jewelry design started',
                message: `Your order ${order.order_number} is now with our jewelry designer.`,
                href: '/account/orders',
                entityType: 'order' as const,
                entityId: id,
                metadata: { order_number: order.order_number, status: 'design_assigned' },
              },
            ]
          : []),
      ]);
    } else if (order.customer_id) {
      await createInAppNotifications([
        {
          audience: 'user' as const,
          recipientUserId: order.customer_id,
          type: 'order_status_update',
          title: 'Jewelry design started',
          message: `Your order ${order.order_number} is now with our jewelry designer.`,
          href: '/account/orders',
          entityType: 'order',
          entityId: id,
          metadata: { order_number: order.order_number, status: 'design_assigned' },
        },
      ]);
    }
  }

  await logAdminAction({
    userId: auth.user.id,
    action: slipOnly ? 'order_design_slip_update' : 'order_designer_assigned',
    resourceType: 'order',
    resourceId: id,
    details: {
      designer_id: portalDesigner?.id ?? null,
      designer_name: designerName || null,
      order_number: order.order_number,
      slip_only: slipOnly,
      design_price: updates.design_price ?? undefined,
      design_due_at: updates.design_due_at ?? undefined,
    },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({
    order: updated,
    designer_name: designerName || order.designer_name,
  });
}
