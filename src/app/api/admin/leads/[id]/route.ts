import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enquiryUpdateSchema } from '@/lib/validators/enquiry';
import { consultationUpdateSchema, type ConsultationUpdateInput } from '@/lib/validators/consultation';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { sendConsultationCompletedEmail, sendConsultationScheduledEmail } from '@/lib/resend/send-consultation-booking';
import type { Consultation } from '@/lib/types/database';
import { logAdminAction } from '@/lib/utils/admin-log';

const SCHEDULE_FIELDS: (keyof ConsultationUpdateInput)[] = [
  'scheduled_date',
  'scheduled_time',
  'scheduled_mode',
  'meeting_link',
  'admin_schedule_notes',
];

function hasScheduleChange(update: ConsultationUpdateInput, current: Consultation) {
  return SCHEDULE_FIELDS.some((field) =>
    Object.prototype.hasOwnProperty.call(update, field) && (update[field] ?? null) !== (current[field] ?? null)
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const adminDb = createAdminClient();
  const { data: member } = await adminDb
    .from('team_members')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  const m = member as { role: string; is_active: boolean } | null;
  if (!m?.is_active) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, role: m.role };
}

// PUT: update an enquiry or consultation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, ...updateData } = body as { type?: string; [key: string]: unknown };
  const admin = createAdminClient();

  if (type === 'consultation') {
    const parsed = consultationUpdateSchema.safeParse(updateData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await admin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    }

    const current = existing as Consultation;
    const now = new Date().toISOString();
    const scheduleChanged = hasScheduleChange(parsed.data, current);
    const nextScheduledDate = parsed.data.scheduled_date !== undefined ? parsed.data.scheduled_date : current.scheduled_date;
    const nextScheduledTime = parsed.data.scheduled_time !== undefined ? parsed.data.scheduled_time : current.scheduled_time;
    const shouldSendSchedule = scheduleChanged && Boolean(nextScheduledDate && nextScheduledTime);
    const updatePayload = {
      ...parsed.data,
      updated_at: now,
      ...(parsed.data.status === 'completed' && !current.completed_at ? { completed_at: now } : {}),
      ...(shouldSendSchedule ? { scheduled_at: now } : {}),
    };

    const { data, error } = await admin
      .from('consultations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    const updated = data as Consultation;
    if (updated.status === 'completed' && !current.completed_email_sent_at) {
      const sent = await sendConsultationCompletedEmail({
        id: updated.id,
        full_name: updated.full_name,
        email: updated.email,
        phone: updated.phone,
        plan_title: updated.plan_title_snapshot || 'Vedic Consultation',
        plan_description: updated.plan_description_snapshot,
        amount_inr: updated.amount_inr,
        currency: updated.currency,
        razorpay_payment_id: updated.razorpay_payment_id,
        preferred_date: updated.preferred_date,
        preferred_time: updated.preferred_time,
        status: updated.status,
      });

      if (sent) {
        await admin
          .from('consultations')
          .update({ completed_email_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    }

    if (shouldSendSchedule) {
      const sent = await sendConsultationScheduledEmail({
        id: updated.id,
        full_name: updated.full_name,
        email: updated.email,
        phone: updated.phone,
        plan_title: updated.plan_title_snapshot || 'Vedic Consultation',
        plan_description: updated.plan_description_snapshot,
        amount_inr: updated.amount_inr,
        currency: updated.currency,
        razorpay_payment_id: updated.razorpay_payment_id,
        preferred_date: updated.preferred_date,
        preferred_time: updated.preferred_time,
        scheduled_date: updated.scheduled_date,
        scheduled_time: updated.scheduled_time,
        scheduled_mode: updated.scheduled_mode,
        meeting_link: updated.meeting_link,
        admin_schedule_notes: updated.admin_schedule_notes,
        status: updated.status,
      });

      if (updated.customer_id) {
        await createInAppNotifications([
          {
            audience: 'user',
            recipientUserId: updated.customer_id,
            type: 'consultation_scheduled',
            title: 'Consultation scheduled',
            message: `${updated.plan_title_snapshot ?? 'Your consultation'} is scheduled for ${updated.scheduled_date} at ${updated.scheduled_time}.`,
            href: '/account/consultations',
            entityType: 'consultation',
            entityId: updated.id,
            metadata: {
              scheduled_date: updated.scheduled_date,
              scheduled_time: updated.scheduled_time,
              scheduled_mode: updated.scheduled_mode,
              meeting_link: updated.meeting_link,
            },
          },
        ]);
      }

      const scheduleSentUpdate: Record<string, string> = { updated_at: new Date().toISOString() };
      if (sent) scheduleSentUpdate.scheduled_email_sent_at = new Date().toISOString();
      if (updated.customer_id) scheduleSentUpdate.scheduled_notification_sent_at = new Date().toISOString();
      if (Object.keys(scheduleSentUpdate).length > 1) {
        await admin.from('consultations').update(scheduleSentUpdate).eq('id', id);
      }
    }

    logAdminAction({ userId: auth.user!.id, action: 'update_consultation', resourceType: 'consultation', resourceId: id, details: parsed.data });
    return NextResponse.json({ lead: data });
  }

  // Default: enquiry
  const parsed = enquiryUpdateSchema.safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data, error } = await admin
    .from('enquiries')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  logAdminAction({ userId: auth.user!.id, action: 'update_enquiry', resourceType: 'enquiry', resourceId: id, details: parsed.data });
  return NextResponse.json({ lead: data });
}
