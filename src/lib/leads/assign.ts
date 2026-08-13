import type { createAdminClient } from '@/lib/supabase/admin';
import { LEAD_REMARK_BY_CODE, inferFollowUpChannel, type LeadFollowUpChannel, type LeadRemarkCode } from '@/lib/leads/constants';
import { createInAppNotifications } from '@/lib/notifications/in-app';

type Admin = ReturnType<typeof createAdminClient>;

function parseOccurredAt(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function logLeadActivity(
  admin: Admin,
  input: {
    enquiryId: string;
    action: string;
    fromValue?: string | null;
    toValue?: string | null;
    meta?: Record<string, unknown>;
    actorId?: string | null;
    actorName?: string | null;
  }
) {
  await admin.from('lead_activity').insert({
    enquiry_id: input.enquiryId,
    action: input.action,
    from_value: input.fromValue ?? null,
    to_value: input.toValue ?? null,
    meta: (input.meta ?? {}) as never,
    actor_id: input.actorId ?? null,
    actor_name: input.actorName ?? null,
  });
}

export async function appendLeadRemark(
  admin: Admin,
  input: {
    enquiryId: string;
    code: LeadRemarkCode;
    note?: string | null;
    channel?: LeadFollowUpChannel | null;
    occurredAt?: string | null;
    followUpDate?: string | null;
    actorId?: string | null;
    actorName?: string | null;
  }
) {
  const def = LEAD_REMARK_BY_CODE[input.code];
  const now = new Date().toISOString();
  const occurredAt = parseOccurredAt(input.occurredAt) ?? now;
  const channel = input.channel ?? inferFollowUpChannel(input.code);
  const { data: remark, error } = await admin
    .from('lead_remarks')
    .insert({
      enquiry_id: input.enquiryId,
      remark_code: input.code,
      remark_label: def.label,
      note: input.note?.trim() || null,
      channel,
      occurred_at: occurredAt,
      created_by: input.actorId ?? null,
      created_by_name: input.actorName ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  const { data: current } = await admin
    .from('enquiries')
    .select('pipeline_stage, remedies_text, name, lead_number')
    .eq('id', input.enquiryId)
    .maybeSingle();
  const stage = (current?.pipeline_stage as string | null) || 'new';
  const currentHasRemedies = Boolean((current?.remedies_text as string | null)?.trim());

  const enquiryPatch: Record<string, unknown> = {
    last_remark_code: input.code,
    last_remark_at: occurredAt,
    updated_at: now,
  };

  if (input.followUpDate !== undefined) {
    enquiryPatch.follow_up_date = input.followUpDate?.trim() || null;
  }

  // ponytail: no follow_up stage — callback/retry remarks stay on verifying or deliver
  if (def.terminal) {
    enquiryPatch.pipeline_stage = 'closed';
    enquiryPatch.status = 'closed';
    enquiryPatch.closed_at = now;
    enquiryPatch.closed_reason = input.code;
  } else if (input.code === 'details_confirmed') {
    enquiryPatch.details_confirmed = true;
    if (stage === 'assigned' || stage === 'verifying' || (stage === 'follow_up' && !currentHasRemedies)) {
      enquiryPatch.pipeline_stage = 'verifying';
      enquiryPatch.status = 'contacted';
    }
  } else if (
    (input.code === 'remedies_explain' || input.code === 'satisfied') &&
    (stage === 'sent_to_customer' || stage === 'follow_up' || stage === 'remedies_explained' || stage === 'conversion')
  ) {
    enquiryPatch.pipeline_stage = 'conversion';
    enquiryPatch.status = 'contacted';
  } else if (
    input.code === 'option_sent' &&
    (stage === 'sent_to_customer' || stage === 'follow_up')
  ) {
    enquiryPatch.pipeline_stage = 'sent_to_customer';
    enquiryPatch.status = 'contacted';
  } else if (stage === 'assigned' || stage === 'verifying' || (stage === 'follow_up' && !currentHasRemedies)) {
    enquiryPatch.pipeline_stage = 'verifying';
    enquiryPatch.status = 'contacted';
  } else if (stage === 'follow_up' && currentHasRemedies) {
    enquiryPatch.pipeline_stage = 'sent_to_customer';
    enquiryPatch.status = 'contacted';
  } else if (stage === 'sent_to_customer' || stage === 'remedies_explained' || stage === 'conversion') {
    enquiryPatch.status = 'contacted';
  }

  await admin.from('enquiries').update(enquiryPatch).eq('id', input.enquiryId);
  await logLeadActivity(admin, {
    enquiryId: input.enquiryId,
    action: 'remark_added',
    toValue: input.code,
    meta: {
      note: input.note ?? null,
      label: def.label,
      channel,
      occurred_at: occurredAt,
    },
    actorId: input.actorId,
    actorName: input.actorName,
  });

  const who = current?.name || 'Lead';
  const sr = current?.lead_number != null ? `SR #${current.lead_number}` : '';

  // Explained remedies → conversion queue (notify manager)
  if (enquiryPatch.pipeline_stage === 'conversion' && stage !== 'conversion') {
    await createInAppNotifications([
      {
        audience: 'admin',
        recipientRole: 'sales',
        type: 'lead_remedies_explained',
        title: 'Remedies explained — conversion pending',
        message: `${who} ${sr} · telecaller explained remedies`.trim(),
        href: `/admin/leads?id=${input.enquiryId}&pipeline=conversion`,
        entityType: 'enquiry',
        entityId: input.enquiryId,
        metadata: { remark_code: input.code },
      },
      {
        audience: 'admin',
        recipientRole: 'admin',
        type: 'lead_remedies_explained',
        title: 'Remedies explained — conversion pending',
        message: `${who} ${sr} · telecaller explained remedies`.trim(),
        href: `/admin/leads?id=${input.enquiryId}&pipeline=conversion`,
        entityType: 'enquiry',
        entityId: input.enquiryId,
        metadata: { remark_code: input.code },
      },
    ]).catch(() => undefined);
  }

  // Terminal close → notify leads managers (fake / not interested / refused to pay)
  if (def.terminal) {
    await createInAppNotifications([
      {
        audience: 'admin',
        recipientRole: 'sales',
        type: 'lead_closed_terminal',
        title: `Lead closed — ${def.label}`,
        message: `${who} ${sr} · marked ${def.label} by ${input.actorName || 'telecaller'}`.trim(),
        href: `/admin/leads?id=${input.enquiryId}&pipeline=closed`,
        entityType: 'enquiry',
        entityId: input.enquiryId,
        metadata: { remark_code: input.code, closed_reason: input.code },
      },
      {
        audience: 'admin',
        recipientRole: 'admin',
        type: 'lead_closed_terminal',
        title: `Lead closed — ${def.label}`,
        message: `${who} ${sr} · marked ${def.label} by ${input.actorName || 'telecaller'}`.trim(),
        href: `/admin/leads?id=${input.enquiryId}&pipeline=closed`,
        entityType: 'enquiry',
        entityId: input.enquiryId,
        metadata: { remark_code: input.code, closed_reason: input.code },
      },
    ]).catch(() => undefined);
  }

  return remark;
}
