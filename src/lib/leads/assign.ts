import type { createAdminClient } from '@/lib/supabase/admin';
import { LEAD_REMARK_BY_CODE, type LeadRemarkCode } from '@/lib/leads/constants';

type Admin = ReturnType<typeof createAdminClient>;

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
    actorId?: string | null;
    actorName?: string | null;
  }
) {
  const def = LEAD_REMARK_BY_CODE[input.code];
  const now = new Date().toISOString();
  const { data: remark, error } = await admin
    .from('lead_remarks')
    .insert({
      enquiry_id: input.enquiryId,
      remark_code: input.code,
      remark_label: def.label,
      note: input.note?.trim() || null,
      created_by: input.actorId ?? null,
      created_by_name: input.actorName ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  const enquiryPatch: Record<string, unknown> = {
    last_remark_code: input.code,
    last_remark_at: now,
    updated_at: now,
  };

  if (def.terminal) {
    enquiryPatch.pipeline_stage = 'closed';
    enquiryPatch.status = 'closed';
    enquiryPatch.closed_at = now;
    enquiryPatch.closed_reason = input.code;
  } else if (input.code === 'details_confirmed') {
    enquiryPatch.details_confirmed = true;
    enquiryPatch.verified_at = now;
    enquiryPatch.verified_by = input.actorId ?? null;
    enquiryPatch.pipeline_stage = 'verified';
    enquiryPatch.status = 'contacted';
  } else if (input.code === 'followup' || input.code === 'call_back_later') {
    enquiryPatch.pipeline_stage = 'follow_up';
  }

  await admin.from('enquiries').update(enquiryPatch).eq('id', input.enquiryId);
  await logLeadActivity(admin, {
    enquiryId: input.enquiryId,
    action: 'remark_added',
    toValue: input.code,
    meta: { note: input.note ?? null, label: def.label },
    actorId: input.actorId,
    actorName: input.actorName,
  });

  return remark;
}
