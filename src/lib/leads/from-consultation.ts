import type { createAdminClient } from '@/lib/supabase/admin';
import type { Consultation } from '@/lib/types/database';
import { logLeadActivity } from '@/lib/leads/assign';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { duplicateNotifySuffix, findPriorDuplicateMatches } from '@/lib/leads/duplicates';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';

type Admin = ReturnType<typeof createAdminClient>;

function isRs101Lead(consultation: Consultation) {
  const title = (consultation.plan_title_snapshot || '').toLowerCase();
  const amount = Number(consultation.amount_inr ?? 0);
  return consultation.plan_id == null && (title.includes('gem recommendation') || amount === RS101_AMOUNT_INR);
}

async function backfillEnquiryFromConsultation(
  admin: Admin,
  enquiryId: string,
  consultation: Consultation,
  ipLocation?: string | null
) {
  const { data: row } = await admin
    .from('enquiries')
    .select('area_of_concern, date_of_birth, birth_time, birth_place, customer_city, customer_state, customer_country, ip_location, phone')
    .eq('id', enquiryId)
    .maybeSingle();
  if (!row) return;

  const patch: Record<string, string | null> = {};
  if (!row.area_of_concern && consultation.life_situation) patch.area_of_concern = consultation.life_situation;
  if (!row.date_of_birth && consultation.date_of_birth) patch.date_of_birth = consultation.date_of_birth;
  if (!row.birth_time && consultation.birth_time) patch.birth_time = consultation.birth_time;
  if (!row.birth_place && consultation.birth_place) patch.birth_place = consultation.birth_place;
  if (!row.customer_city && consultation.customer_city) patch.customer_city = consultation.customer_city;
  if (!row.customer_state && consultation.customer_state) patch.customer_state = consultation.customer_state;
  if (!row.customer_country && consultation.customer_country) patch.customer_country = consultation.customer_country;
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
    : `Vedic Consultation — ${consultation.plan_title_snapshot || 'Paid plan'}`;

  const message = [
    rs101 ? 'Paid homepage gemstone recommendation (₹101)' : 'Paid Vedic Consultation booking',
    `Plan: ${consultation.plan_title_snapshot || '—'}`,
    consultation.plan_description_snapshot ? `Plan details: ${consultation.plan_description_snapshot}` : null,
    consultation.mode ? `Mode: ${consultation.mode}` : null,
    `Name: ${consultation.full_name}`,
    `Email: ${consultation.email}`,
    consultation.phone ? `Phone: ${consultation.phone}` : null,
    consultation.date_of_birth ? `Date of birth: ${consultation.date_of_birth}` : null,
    consultation.birth_time ? `Birth time: ${consultation.birth_time}` : null,
    consultation.birth_place ? `Birth place: ${consultation.birth_place}` : null,
    consultation.customer_city ? `City / District: ${consultation.customer_city}` : null,
    consultation.customer_state ? `State: ${consultation.customer_state}` : null,
    consultation.customer_country ? `Country: ${consultation.customer_country}` : null,
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
      customer_city: consultation.customer_city,
      customer_state: consultation.customer_state,
      customer_country: consultation.customer_country,
      area_of_concern: consultation.life_situation,
      ip_location: opts?.ipLocation || null,
      payment_received: consultation.payment_status === 'captured',
      payment_note: consultation.payment_status === 'captured'
        ? `₹${consultation.amount_inr ?? 0} received via Razorpay`
        : null,
      payment_received_at: consultation.payment_status === 'captured' ? now : null,
      consultation_id: consultation.id,
    })
    .select('id, lead_number, created_at')
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

  const matches = await findPriorDuplicateMatches(admin, {
    id: enquiry.id,
    lead_number: enquiry.lead_number,
    date_of_birth: consultation.date_of_birth,
    birth_time: consultation.birth_time,
    birth_place: consultation.birth_place,
    created_at: enquiry.created_at,
  });
  const dupeNote = duplicateNotifySuffix(matches);
  if (matches[0]) {
    await logLeadActivity(admin, {
      enquiryId: enquiry.id,
      action: 'duplicate_detected',
      toValue: matches[0].status,
      meta: {
        prior_id: matches[0].id,
        prior_lead_number: matches[0].lead_number,
        matched_fields: matches[0].matched_fields,
        prior_telecaller: matches[0].telecaller_name,
      },
      actorName: 'system',
    });
  }

  await createInAppNotifications([
    {
      audience: 'admin',
      recipientRole: 'sales',
      type: rs101 ? 'new_remedies_lead' : 'new_consultation_lead',
      title: dupeNote
        ? `${dupeNote.split(' ·')[0]} — assign telecaller`
        : rs101
          ? 'New remedies lead (₹101) — assign telecaller'
          : 'New consultation lead — assign telecaller',
      message: dupeNote
        ? `${consultation.full_name} · ${enquiryType} (SR #${enquiry.lead_number ?? ''}) · ${dupeNote}`
        : `${consultation.full_name} · ${enquiryType} (SR #${enquiry.lead_number ?? ''})`,
      href: `/admin/leads?type=enquiry&id=${enquiry.id}`,
      entityType: 'enquiry',
      entityId: enquiry.id,
      metadata: {
        consultation_id: consultation.id,
        enquiry_type: enquiryType,
        source,
        duplicate_status: matches[0]?.status ?? null,
        prior_lead_id: matches[0]?.id ?? null,
      },
    },
  ]);

  return enquiry.id as string;
}
