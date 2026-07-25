import type { createAdminClient } from '@/lib/supabase/admin';
import type { Consultation } from '@/lib/types/database';
import { logLeadActivity } from '@/lib/leads/assign';
import { createInAppNotifications } from '@/lib/notifications/in-app';

type Admin = ReturnType<typeof createAdminClient>;

function isRs101Lead(consultation: Consultation) {
  const title = (consultation.plan_title_snapshot || '').toLowerCase();
  const amount = Number(consultation.amount_inr ?? 0);
  return consultation.plan_id == null && (title.includes('gem recommendation') || amount === 101);
}

async function backfillEnquiryFromConsultation(
  admin: Admin,
  enquiryId: string,
  consultation: Consultation,
  ipLocation?: string | null
) {
  const { data: row } = await admin
    .from('enquiries')
    .select('area_of_concern, date_of_birth, birth_time, birth_place, ip_location, phone')
    .eq('id', enquiryId)
    .maybeSingle();
  if (!row) return;

  const patch: Record<string, string | null> = {};
  if (!row.area_of_concern && consultation.life_situation) patch.area_of_concern = consultation.life_situation;
  if (!row.date_of_birth && consultation.date_of_birth) patch.date_of_birth = consultation.date_of_birth;
  if (!row.birth_time && consultation.birth_time) patch.birth_time = consultation.birth_time;
  if (!row.birth_place && consultation.birth_place) patch.birth_place = consultation.birth_place;
  if (!row.phone && consultation.phone) patch.phone = consultation.phone;
  if (!row.ip_location && ipLocation) patch.ip_location = ipLocation;
  if (Object.keys(patch).length === 0) return;

  await admin.from('enquiries').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', enquiryId);
}

/** After payment capture: create CRM enquiry so both Rs 101 leads and detailed consultations share the same pipeline. */
export async function ensureLeadFromConsultation(
  admin: Admin,
  consultation: Consultation,
  opts?: { ipLocation?: string | null }
) {
  const { data: existing } = await admin
    .from('enquiries')
    .select('id')
    .eq('consultation_id', consultation.id)
    .maybeSingle();

  if (existing?.id) {
    await backfillEnquiryFromConsultation(admin, existing.id as string, consultation, opts?.ipLocation);
    return existing.id as string;
  }

  const rs101 = isRs101Lead(consultation);
  const enquiryType = rs101 ? 'Remedies Recommendation' : 'Consultation';
  const source = rs101 ? 'homepage_recommendation' : 'consultation_page';
  const subject = rs101
    ? 'Gemstone Recommendation Request (₹101)'
    : `${consultation.plan_title_snapshot || 'Consultation'} booking`;

  const message = [
    rs101 ? 'Paid homepage gemstone recommendation (₹101)' : 'Paid detailed consultation booking',
    `Plan: ${consultation.plan_title_snapshot || '—'}`,
    `Name: ${consultation.full_name}`,
    `Email: ${consultation.email}`,
    consultation.phone ? `Phone: ${consultation.phone}` : null,
    consultation.date_of_birth ? `Date of birth: ${consultation.date_of_birth}` : null,
    consultation.birth_time ? `Birth time: ${consultation.birth_time}` : null,
    consultation.birth_place ? `Birth place: ${consultation.birth_place}` : null,
    consultation.life_situation ? `Purpose: ${consultation.life_situation}` : null,
    consultation.preferred_date ? `Preferred date: ${consultation.preferred_date}` : null,
    consultation.preferred_time ? `Preferred time: ${consultation.preferred_time}` : null,
    consultation.message ? `Message: ${consultation.message}` : null,
    `Payment: ₹${consultation.amount_inr ?? 0} (${consultation.payment_status})`,
    consultation.razorpay_payment_id ? `Razorpay payment: ${consultation.razorpay_payment_id}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const now = new Date().toISOString();
  const { data: enquiry, error } = await admin
    .from('enquiries')
    .insert({
      name: consultation.full_name,
      email: consultation.email,
      phone: consultation.phone,
      subject,
      message,
      source,
      status: 'new',
      pipeline_stage: 'new',
      enquiry_type: enquiryType,
      date_of_birth: consultation.date_of_birth,
      birth_time: consultation.birth_time,
      birth_place: consultation.birth_place,
      area_of_concern: consultation.life_situation,
      ip_location: opts?.ipLocation || null,
      payment_received: consultation.payment_status === 'captured',
      payment_note: consultation.payment_status === 'captured'
        ? `₹${consultation.amount_inr ?? 0} received via Razorpay`
        : null,
      payment_received_at: consultation.payment_status === 'captured' ? now : null,
      consultation_id: consultation.id,
    })
    .select('id, lead_number')
    .single();

  if (error || !enquiry) {
    // Unique race: another request already created it
    const { data: raced } = await admin
      .from('enquiries')
      .select('id')
      .eq('consultation_id', consultation.id)
      .maybeSingle();
    if (raced?.id) {
      await backfillEnquiryFromConsultation(admin, raced.id as string, consultation, opts?.ipLocation);
      return raced.id as string;
    }
    console.error('[Leads] Failed to create enquiry from consultation:', error);
    throw new Error(error?.message || 'Failed to create CRM lead from consultation');
  }

  await logLeadActivity(admin, {
    enquiryId: enquiry.id,
    action: 'created_from_consultation',
    toValue: 'new',
    meta: {
      consultation_id: consultation.id,
      enquiry_type: enquiryType,
      source,
      amount_inr: consultation.amount_inr,
    },
    actorName: 'system',
  });

  await createInAppNotifications([
    {
      audience: 'admin',
      recipientRole: 'sales',
      type: rs101 ? 'new_remedies_lead' : 'new_consultation_lead',
      title: rs101 ? 'New remedies lead (₹101) — assign telecaller' : 'New consultation lead — assign telecaller',
      message: `${consultation.full_name} · ${enquiryType} (SR #${enquiry.lead_number ?? ''})`,
      href: `/admin/leads?type=enquiry&id=${enquiry.id}`,
      entityType: 'enquiry',
      entityId: enquiry.id,
      metadata: {
        consultation_id: consultation.id,
        enquiry_type: enquiryType,
        source,
      },
    },
  ]);

  return enquiry.id as string;
}
