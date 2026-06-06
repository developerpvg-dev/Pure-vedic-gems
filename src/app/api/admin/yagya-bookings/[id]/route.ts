import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { yagyaBookingUpdateSchema } from '@/lib/validators/yagya';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { logAdminAction } from '@/lib/utils/admin-log';
import type { YagyaBooking } from '@/lib/types/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if ('error' in auth) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = yagyaBookingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from('yagya_bookings')
    .select('*')
    .eq('id', id)
    .single();

  const current = existing as YagyaBooking | null;
  if (existingError || !current) {
    return NextResponse.json({ error: 'Yagya booking not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updatePayload = {
    ...parsed.data,
    updated_at: now,
    ...(parsed.data.status === 'completed' && !current.completed_at ? { completed_at: now } : {}),
  };

  const { data, error } = await admin
    .from('yagya_bookings')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    console.error('[Admin yagya-bookings] Update failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  const updated = data as YagyaBooking;

  await logAdminAction({
    userId: auth.user.id,
    action: 'yagya_booking.update',
    resourceType: 'yagya_booking',
    resourceId: updated.id,
    details: { status: updated.status, payment_status: updated.payment_status },
  });

  if (parsed.data.status && parsed.data.status !== current.status && updated.customer_id) {
    await createInAppNotifications([
      {
        audience: 'user',
        recipientUserId: updated.customer_id,
        type: 'yagya_status_update',
        title: 'Yagya booking updated',
        message: `Your ${updated.yagya_title_snapshot} booking is now "${updated.status.replace(/_/g, ' ')}".`,
        href: '/account/yagyas',
        entityType: 'yagya_booking',
        entityId: updated.id,
        metadata: { status: updated.status },
      },
    ]);
  }

  return NextResponse.json({ booking: updated });
}
