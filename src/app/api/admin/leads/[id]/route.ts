import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { enquiryUpdateSchema } from '@/lib/validators/enquiry';
import { consultationUpdateSchema, type ConsultationUpdateInput } from '@/lib/validators/consultation';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { sendConsultationCompletedEmail, sendConsultationScheduledEmail } from '@/lib/resend/send-consultation-booking';
import type { Consultation, Enquiry } from '@/lib/types/database';
import { logAdminAction } from '@/lib/utils/admin-log';
import {
  canAssignLeads,
  canEditBirthFields,
  canEditOutcomeFlags,
  canEditRemedies,
  canForwardToAstrologer,
  canSendRemediesToTelecaller,
  canSetPipelineStage,
  canViewEnquiry,
  isAstrologerRole,
  isLeadManager,
  isTelecomRole,
} from '@/lib/leads/permissions';
import {
  canTransitionPipeline,
  isLeadPipelineStage,
  type LeadPipelineStage,
} from '@/lib/leads/constants';
import { logLeadActivity } from '@/lib/leads/assign';

const SCHEDULE_FIELDS: (keyof ConsultationUpdateInput)[] = [
  'scheduled_date',
  'scheduled_time',
  'scheduled_mode',
  'meeting_link',
  'admin_schedule_notes',
];

function hasScheduleChange(update: ConsultationUpdateInput, current: Consultation) {
  return SCHEDULE_FIELDS.some(
    (field) =>
      Object.prototype.hasOwnProperty.call(update, field) && (update[field] ?? null) !== (current[field] ?? null)
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: enquiryRow, error } = await admin.from('enquiries').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Failed to load lead' }, { status: 500 });
  if (!enquiryRow) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  const enquiry = enquiryRow as Enquiry;

  if (!canViewEnquiry(auth.member.normalizedRole, auth.user.id, enquiry)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const assignedTo = enquiry.assigned_to;
  const astrologerId = enquiry.astrologer_id;

  const [{ data: remarks }, { data: activity }, { data: assignee }, { data: astrologer }] = await Promise.all([
    admin.from('lead_remarks').select('*').eq('enquiry_id', id).order('created_at', { ascending: true }),
    admin.from('lead_activity').select('*').eq('enquiry_id', id).order('created_at', { ascending: false }).limit(50),
    assignedTo
      ? admin.from('team_members').select('id, name, role').eq('id', assignedTo).maybeSingle()
      : Promise.resolve({ data: null as { id: string; name: string; role: string } | null }),
    astrologerId
      ? admin.from('team_members').select('id, name, role').eq('id', astrologerId).maybeSingle()
      : Promise.resolve({ data: null as { id: string; name: string; role: string } | null }),
  ]);

  return NextResponse.json({
    lead: { ...enquiry, _type: 'enquiry' },
    remarks: remarks ?? [],
    activity: activity ?? [],
    assignee: assignee ?? null,
    astrologer: astrologer ?? null,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, action, ...updateData } = body as {
    type?: string;
    action?: string;
    [key: string]: unknown;
  };
  const admin = createAdminClient();
  const role = auth.member.normalizedRole;
  const actorName = auth.member.name;
  const now = new Date().toISOString();

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
    const scheduleChanged = hasScheduleChange(parsed.data, current);
    const nextScheduledDate =
      parsed.data.scheduled_date !== undefined ? parsed.data.scheduled_date : current.scheduled_date;
    const nextScheduledTime =
      parsed.data.scheduled_time !== undefined ? parsed.data.scheduled_time : current.scheduled_time;
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

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

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

    logAdminAction({
      userId: auth.user!.id,
      action: 'update_consultation',
      resourceType: 'consultation',
      resourceId: id,
      details: parsed.data,
    });
    return NextResponse.json({ lead: data });
  }

  // Enquiry CRM update
  const { data: existing, error: existingError } = await admin.from('enquiries').select('*').eq('id', id).single();
  if (existingError || !existing) {
    return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
  }
  const current = existing as Enquiry;

  if (!canViewEnquiry(role, auth.user.id, current)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Workflow actions (strict role + stage rules) ──

  if (action === 'assign_telecaller') {
    if (!canAssignLeads(role)) {
      return NextResponse.json({ error: 'Only leads manager can assign telecallers' }, { status: 403 });
    }
    const telecallerId = typeof updateData.assigned_to === 'string' ? updateData.assigned_to : null;
    if (!telecallerId) {
      return NextResponse.json({ error: 'Select a telecaller' }, { status: 400 });
    }
    const { data: member } = await admin
      .from('team_members')
      .select('id, name, role')
      .eq('id', telecallerId)
      .eq('is_active', true)
      .maybeSingle();
    if (!member || (member.role !== 'telecom' && member.role !== 'sales')) {
      return NextResponse.json({ error: 'Invalid telecaller' }, { status: 400 });
    }
    if (!['new', 'closed', 'assigned', 'verifying', 'verified'].includes(current.pipeline_stage)) {
      return NextResponse.json({ error: 'Cannot assign telecaller at this stage' }, { status: 400 });
    }
    const nextStage: LeadPipelineStage =
      current.pipeline_stage === 'new' || current.pipeline_stage === 'closed' ? 'assigned' : (current.pipeline_stage as LeadPipelineStage);

    const { data, error } = await admin
      .from('enquiries')
      .update({
        assigned_to: member.id,
        assigned_at: now,
        pipeline_stage: nextStage,
        status: 'contacted',
        updated_at: now,
        ...(current.pipeline_stage === 'closed' ? { closed_at: null, closed_reason: null } : {}),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Assign failed', detail: error.message }, { status: 500 });

    await logLeadActivity(admin, {
      enquiryId: id,
      action: 'assigned_telecaller',
      fromValue: current.pipeline_stage,
      toValue: 'assigned',
      meta: { telecaller_id: member.id, telecaller_name: member.name },
      actorId: auth.user.id,
      actorName,
    });

    await createInAppNotifications([
      {
        audience: 'admin',
        recipientUserId: member.id,
        type: 'lead_assigned_telecom',
        title: 'New lead to verify',
        message: `${current.name} — call & confirm details (SR #${current.lead_number ?? ''})`,
        href: `/admin/leads?id=${id}`,
        entityType: 'enquiry',
        entityId: id,
        metadata: { lead_number: current.lead_number },
      },
    ]);

    return NextResponse.json({ lead: data });
  }

  if (action === 'mark_verified') {
    if (!isTelecomRole(role) && !isLeadManager(role)) {
      return NextResponse.json({ error: 'Only telecaller or manager can mark verified' }, { status: 403 });
    }
    if (!['assigned', 'verifying', 'verified'].includes(current.pipeline_stage)) {
      return NextResponse.json({ error: 'Lead must be with telecaller before verifying' }, { status: 400 });
    }
    const { data, error } = await admin
      .from('enquiries')
      .update({
        details_confirmed: true,
        verified_at: now,
        verified_by: auth.user.id,
        pipeline_stage: 'verified',
        status: 'contacted',
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    await logLeadActivity(admin, {
      enquiryId: id,
      action: 'marked_verified',
      fromValue: current.pipeline_stage,
      toValue: 'verified',
      actorId: auth.user.id,
      actorName,
    });

    await createInAppNotifications([
      {
        audience: 'admin',
        recipientRole: 'sales',
        type: 'lead_verified',
        title: 'Lead verified — forward to astrologer',
        message: `${current.name} details confirmed (SR #${current.lead_number ?? ''})`,
        href: `/admin/leads?id=${id}&pipeline=verified`,
        entityType: 'enquiry',
        entityId: id,
        metadata: { lead_number: current.lead_number },
      },
    ]);

    return NextResponse.json({ lead: data });
  }

  if (action === 'forward_to_astrologer') {
    if (!canForwardToAstrologer(role)) {
      return NextResponse.json({ error: 'Only leads manager can forward to astrologer' }, { status: 403 });
    }
    if (current.pipeline_stage !== 'verified') {
      return NextResponse.json({ error: 'Lead must be Verified before forwarding to astrologer' }, { status: 400 });
    }
    const astrologerId = typeof updateData.astrologer_id === 'string' ? updateData.astrologer_id : current.astrologer_id;
    if (!astrologerId) {
      return NextResponse.json({ error: 'Select an astrologer / pandit ji' }, { status: 400 });
    }
    const { data: astro } = await admin.from('team_members').select('id, name, role').eq('id', astrologerId).maybeSingle();
    if (!astro || astro.role !== 'astrologer') {
      return NextResponse.json({ error: 'Invalid astrologer' }, { status: 400 });
    }
    const { data, error } = await admin
      .from('enquiries')
      .update({
        astrologer_id: astro.id,
        astrologer_name: astro.name,
        astrologer_forwarded_at: now,
        pipeline_stage: 'with_astrologer',
        status: 'contacted',
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Forward failed' }, { status: 500 });

    await logLeadActivity(admin, {
      enquiryId: id,
      action: 'forwarded_to_astrologer',
      fromValue: current.pipeline_stage,
      toValue: 'with_astrologer',
      meta: { astrologer_id: astro.id, astrologer_name: astro.name },
      actorId: auth.user.id,
      actorName,
    });

    await createInAppNotifications([
      {
        audience: 'admin',
        recipientUserId: astro.id,
        type: 'lead_forwarded_astrologer',
        title: 'New chart for remedies',
        message: `${current.name} — write remedies (SR #${current.lead_number ?? ''})`,
        href: `/admin/leads?id=${id}`,
        entityType: 'enquiry',
        entityId: id,
        metadata: { lead_number: current.lead_number },
      },
    ]);

    return NextResponse.json({ lead: data });
  }

  if (action === 'submit_remedies') {
    if (!isAstrologerRole(role) && !isLeadManager(role)) {
      return NextResponse.json({ error: 'Only astrologer can submit remedies' }, { status: 403 });
    }
    if (current.pipeline_stage !== 'with_astrologer' && current.pipeline_stage !== 'remedies_ready') {
      return NextResponse.json({ error: 'Lead must be with astrologer' }, { status: 400 });
    }
    const remedies =
      typeof updateData.remedies_text === 'string' ? updateData.remedies_text : current.remedies_text;
    if (!remedies?.trim()) {
      return NextResponse.json({ error: 'Remedies text is required' }, { status: 400 });
    }
    const { data, error } = await admin
      .from('enquiries')
      .update({
        remedies_text: remedies,
        astrologer_replied_at: now,
        pipeline_stage: 'remedies_ready',
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    await logLeadActivity(admin, {
      enquiryId: id,
      action: 'remedies_submitted',
      fromValue: current.pipeline_stage,
      toValue: 'remedies_ready',
      actorId: auth.user.id,
      actorName,
    });

    // Notify leads manager to review / edit / send to telecaller
    await createInAppNotifications([
      {
        audience: 'admin',
        recipientRole: 'sales',
        type: 'lead_remedies_ready',
        title: 'Remedies ready — review & send to telecaller',
        message: `${current.name} remedies submitted by ${actorName || 'astrologer'} (SR #${current.lead_number ?? ''})`,
        href: `/admin/leads?id=${id}&pipeline=remedies_ready`,
        entityType: 'enquiry',
        entityId: id,
        metadata: { lead_number: current.lead_number },
      },
    ]);

    return NextResponse.json({ lead: data });
  }

  if (action === 'send_to_telecaller') {
    if (!canSendRemediesToTelecaller(role)) {
      return NextResponse.json({ error: 'Only leads manager can send remedies to telecaller' }, { status: 403 });
    }
    if (current.pipeline_stage !== 'remedies_ready' && current.pipeline_stage !== 'sent_to_customer') {
      return NextResponse.json({ error: 'Remedies must be ready before sending to telecaller' }, { status: 400 });
    }
    if (!current.assigned_to) {
      return NextResponse.json({ error: 'No telecaller assigned on this lead' }, { status: 400 });
    }
    const remedies =
      typeof updateData.remedies_text === 'string' ? updateData.remedies_text.trim() : (current.remedies_text || '').trim();
    if (!remedies) {
      return NextResponse.json({ error: 'Final remedies text is required' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('enquiries')
      .update({
        remedies_text: remedies,
        forwarded_to_customer_at: now,
        pipeline_stage: 'sent_to_customer',
        status: 'contacted',
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    await logLeadActivity(admin, {
      enquiryId: id,
      action: 'sent_remedies_to_telecaller',
      fromValue: current.pipeline_stage,
      toValue: 'sent_to_customer',
      meta: { telecaller_id: current.assigned_to },
      actorId: auth.user.id,
      actorName,
    });

    await createInAppNotifications([
      {
        audience: 'admin',
        recipientUserId: current.assigned_to,
        type: 'lead_remedies_for_delivery',
        title: 'Remedies ready to share with customer',
        message: `${current.name} — contact customer with final remedies (SR #${current.lead_number ?? ''})`,
        href: `/admin/leads?id=${id}`,
        entityType: 'enquiry',
        entityId: id,
        metadata: { lead_number: current.lead_number },
      },
    ]);

    return NextResponse.json({ lead: data });
  }

  // legacy aliases
  if (action === 'mark_remedies_ready') {
    return NextResponse.json(
      { error: 'Use action submit_remedies' },
      { status: 400 }
    );
  }
  if (action === 'forward_to_customer') {
    return NextResponse.json(
      { error: 'Use action send_to_telecaller' },
      { status: 400 }
    );
  }

  const parsed = enquiryUpdateSchema.safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = { updated_at: now };
  const d = parsed.data;

  if (d.assigned_to !== undefined) {
    if (!canAssignLeads(role)) {
      return NextResponse.json({ error: 'Cannot assign leads' }, { status: 403 });
    }
    patch.assigned_to = d.assigned_to;
    patch.assigned_at = d.assigned_to ? now : null;
    if (d.assigned_to && current.pipeline_stage === 'new') {
      patch.pipeline_stage = 'assigned';
      patch.status = 'contacted';
    }
  }

  if (d.pipeline_stage !== undefined) {
    if (!isLeadPipelineStage(d.pipeline_stage) || !canSetPipelineStage(role, d.pipeline_stage)) {
      return NextResponse.json({ error: 'Cannot set this pipeline stage' }, { status: 403 });
    }
    if (!canTransitionPipeline(current.pipeline_stage, d.pipeline_stage)) {
      return NextResponse.json(
        { error: `Invalid stage transition: ${current.pipeline_stage} → ${d.pipeline_stage}` },
        { status: 400 }
      );
    }
    patch.pipeline_stage = d.pipeline_stage;
    if (d.pipeline_stage === 'closed') {
      patch.closed_at = now;
      patch.status = 'closed';
    }
    if (d.pipeline_stage === 'verified') {
      patch.details_confirmed = true;
      patch.verified_at = now;
      patch.verified_by = auth.user.id;
    }
  }

  if (d.astrologer_id !== undefined || d.astrologer_name !== undefined) {
    if (!canForwardToAstrologer(role) && !canAssignLeads(role)) {
      return NextResponse.json({ error: 'Cannot set astrologer' }, { status: 403 });
    }
    if (d.astrologer_id !== undefined) patch.astrologer_id = d.astrologer_id;
    if (d.astrologer_name !== undefined) patch.astrologer_name = d.astrologer_name;
  }

  if (d.remedies_text !== undefined) {
    if (!canEditRemedies(role)) {
      return NextResponse.json({ error: 'Cannot edit remedies' }, { status: 403 });
    }
    patch.remedies_text = d.remedies_text;
  }

  if (
    d.date_of_birth !== undefined ||
    d.birth_time !== undefined ||
    d.birth_place !== undefined ||
    d.area_of_concern !== undefined ||
    d.enquiry_type !== undefined ||
    d.ip_location !== undefined ||
    d.name !== undefined ||
    d.email !== undefined ||
    d.phone !== undefined
  ) {
    if (!canEditBirthFields(role)) {
      return NextResponse.json({ error: 'Cannot edit customer details' }, { status: 403 });
    }
    if (d.date_of_birth !== undefined) patch.date_of_birth = d.date_of_birth || null;
    if (d.birth_time !== undefined) patch.birth_time = d.birth_time;
    if (d.birth_place !== undefined) patch.birth_place = d.birth_place;
    if (d.area_of_concern !== undefined) patch.area_of_concern = d.area_of_concern;
    if (d.enquiry_type !== undefined) patch.enquiry_type = d.enquiry_type;
    if (d.ip_location !== undefined) patch.ip_location = d.ip_location;
    if (d.name !== undefined) patch.name = d.name;
    if (d.email !== undefined) patch.email = d.email;
    if (d.phone !== undefined) patch.phone = d.phone;
  }

  if (
    d.astrologer_help !== undefined ||
    d.product_purchase !== undefined ||
    d.sale_close !== undefined ||
    d.feedback_received !== undefined
  ) {
    if (!canEditOutcomeFlags(role)) {
      return NextResponse.json({ error: 'Cannot edit outcome flags' }, { status: 403 });
    }
    if (d.astrologer_help !== undefined) patch.astrologer_help = d.astrologer_help;
    if (d.product_purchase !== undefined) patch.product_purchase = d.product_purchase;
    if (d.sale_close !== undefined) {
      patch.sale_close = d.sale_close;
      if (d.sale_close) {
        patch.pipeline_stage = 'closed';
        patch.status = 'resolved';
        patch.closed_at = now;
        patch.closed_reason = 'sale_close';
      }
    }
    if (d.feedback_received !== undefined) {
      patch.feedback_received = d.feedback_received;
      if (d.feedback_received) patch.feedback_at = now;
    }
  }

  if (d.details_confirmed !== undefined) {
    if (!canEditBirthFields(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    patch.details_confirmed = d.details_confirmed;
    if (d.details_confirmed) {
      patch.verified_at = now;
      patch.verified_by = auth.user.id;
      if (current.pipeline_stage === 'assigned' || current.pipeline_stage === 'verifying') {
        patch.pipeline_stage = 'verified' satisfies LeadPipelineStage;
      }
    }
  }

  if (d.payment_received !== undefined || d.payment_note !== undefined) {
    if (!canEditBirthFields(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (d.payment_received !== undefined) {
      patch.payment_received = d.payment_received;
      patch.payment_received_at = d.payment_received ? now : null;
    }
    if (d.payment_note !== undefined) patch.payment_note = d.payment_note;
  }

  if (d.status !== undefined) patch.status = d.status;
  if (d.follow_up_date !== undefined) patch.follow_up_date = d.follow_up_date;
  if (d.internal_notes !== undefined) patch.internal_notes = d.internal_notes;

  const { data, error } = await admin.from('enquiries').update(patch).eq('id', id).select().single();
  if (error) {
    return NextResponse.json({ error: 'Update failed', detail: error.message }, { status: 500 });
  }

  const changedKeys = Object.keys(patch).filter((k) => k !== 'updated_at');
  if (changedKeys.length) {
    await logLeadActivity(admin, {
      enquiryId: id,
      action: 'updated',
      meta: { fields: changedKeys, patch: Object.fromEntries(changedKeys.map((k) => [k, patch[k]])) },
      actorId: auth.user.id,
      actorName,
    });
  }

  logAdminAction({
    userId: auth.user!.id,
    action: 'update_enquiry',
    resourceType: 'enquiry',
    resourceId: id,
    details: patch,
  });
  return NextResponse.json({ lead: data });
}
