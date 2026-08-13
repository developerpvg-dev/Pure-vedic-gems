import type { createAdminClient } from '@/lib/supabase/admin';
import type { Consultation, Json } from '@/lib/types/database';
import { ensureLeadFromConsultation } from '@/lib/leads/from-consultation';
import { sendConsultationBookingEmails } from '@/lib/resend/send-consultation-booking';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';
import { formatChargedMoney } from '@/lib/currency/format-charged';
import {
  findCapturedPaymentOnOrder,
  type RazorpayPaymentFacts,
} from '@/lib/razorpay/transactions';

type Admin = ReturnType<typeof createAdminClient>;

export function consultationAmountMatches(
  consultation: Pick<Consultation, 'amount_paise' | 'amount_inr' | 'currency'>,
  facts: Pick<RazorpayPaymentFacts, 'razorpayOrderAmountPaise' | 'razorpayPaymentAmountPaise' | 'currency'>
) {
  const expectedPaise = consultation.amount_paise ?? Math.round(Number(consultation.amount_inr ?? 0) * 100);
  const expectedCurrency = String(consultation.currency || 'INR').toUpperCase();
  return (
    facts.razorpayOrderAmountPaise === expectedPaise &&
    facts.razorpayPaymentAmountPaise === expectedPaise &&
    facts.currency === expectedCurrency
  );
}

export async function findConsultationByRazorpayOrder(
  admin: Admin,
  razorpayOrderId: string,
  notesConsultationId?: string | null
) {
  const { data } = await admin
    .from('consultations')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle();
  if (data) return data as Consultation;
  if (!notesConsultationId) return null;
  const { data: byNote } = await admin.from('consultations').select('*').eq('id', notesConsultationId).maybeSingle();
  return (byNote as Consultation | null) ?? null;
}

export type ApplyConsultationFactsResult =
  | { status: 'captured'; consultation: Consultation; enquiryId: string | null }
  | { status: 'amount_mismatch'; consultation: Consultation }
  | { status: 'not_captured'; consultation: Consultation }
  | { status: 'update_failed'; consultation: Consultation };

export async function applyRazorpayFactsToConsultation(opts: {
  admin: Admin;
  consultation: Consultation;
  facts: RazorpayPaymentFacts;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
  ipLocation?: string | null;
}): Promise<ApplyConsultationFactsResult> {
  const { admin, facts, razorpayPaymentId, razorpaySignature, ipLocation } = opts;
  let consultation = opts.consultation;

  if (consultation.payment_status === 'captured') {
    let enquiryId: string | null = null;
    try {
      enquiryId = await ensureLeadFromConsultation(admin, consultation, { ipLocation });
    } catch (error) {
      console.error('[Consultation payment] CRM lead ensure failed (already captured):', error);
    }
    return { status: 'captured', consultation, enquiryId };
  }

  if (!consultationAmountMatches(consultation, facts)) {
    await admin
      .from('consultations')
      .update({
        payment_status: 'amount_mismatch',
        status: 'payment_review',
        payment_review_reason: 'Gateway amount or currency did not match booking amount',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature ?? consultation.razorpay_signature,
        payment_metadata: facts as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultation.id);
    await createInAppNotifications([
      {
        audience: 'admin',
        recipientRole: 'finance',
        type: 'consultation_payment_review',
        title: 'Consultation payment needs review',
        message: `Consultation payment for ${consultation.full_name} did not match the expected amount.`,
        href: '/admin/leads',
        entityType: 'consultation',
        entityId: consultation.id,
        metadata: { consultation_id: consultation.id },
      },
    ]);
    return { status: 'amount_mismatch', consultation };
  }

  if (!facts.captured) {
    await admin
      .from('consultations')
      .update({
        payment_status: facts.paymentStatus === 'authorized' ? 'authorized' : 'failed',
        status: facts.paymentStatus === 'authorized' ? 'pending_payment' : 'payment_review',
        payment_failure_reason:
          facts.paymentStatus === 'authorized' ? null : `Gateway status: ${facts.paymentStatus}`,
        payment_review_reason:
          facts.paymentStatus === 'authorized' ? 'Payment authorized and awaiting capture' : null,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature ?? consultation.razorpay_signature,
        payment_metadata: facts as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultation.id);
    return { status: 'not_captured', consultation };
  }

  const { data: updatedRow, error: updateError } = await admin
    .from('consultations')
    .update({
      payment_status: 'captured',
      status: 'confirmed',
      payment_method: facts.method,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature ?? consultation.razorpay_signature,
      payment_failure_reason: null,
      payment_review_reason: null,
      amount_verified_at: new Date().toISOString(),
      payment_metadata: facts as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', consultation.id)
    .select('*')
    .single();

  const updated = updatedRow as Consultation | null;
  if (updateError || !updated) {
    console.error('[Consultation payment] Finalize failed:', updateError);
    return { status: 'update_failed', consultation };
  }
  consultation = updated;

  if (!consultation.confirmation_email_sent_at || !consultation.admin_notification_sent_at) {
    const sent = await sendConsultationBookingEmails({
      id: consultation.id,
      full_name: consultation.full_name,
      email: consultation.email,
      phone: consultation.phone,
      plan_title: consultation.plan_title_snapshot ?? 'Vedic Consultation',
      plan_description: consultation.plan_description_snapshot,
      amount_inr: consultation.amount_inr,
      amount_paise: consultation.amount_paise,
      currency: consultation.currency,
      razorpay_payment_id: consultation.razorpay_payment_id,
      mode: consultation.mode,
      preferred_date: consultation.preferred_date,
      preferred_time: consultation.preferred_time,
      date_of_birth: consultation.date_of_birth,
      birth_time: consultation.birth_time,
      birth_place: consultation.birth_place,
      life_situation: consultation.life_situation,
      message: consultation.message,
      status: consultation.status,
    });

    const emailUpdate: Record<string, string> = {};
    const now = new Date().toISOString();
    if (sent.customer && !consultation.confirmation_email_sent_at) emailUpdate.confirmation_email_sent_at = now;
    if (sent.admin && !consultation.admin_notification_sent_at) emailUpdate.admin_notification_sent_at = now;
    if (Object.keys(emailUpdate).length > 0) {
      await admin.from('consultations').update(emailUpdate).eq('id', consultation.id);
    }
  }

  let enquiryId: string | null = null;
  try {
    enquiryId = await ensureLeadFromConsultation(admin, consultation, { ipLocation });
  } catch (error) {
    console.error('[Consultation payment] CRM lead create failed:', error);
  }

  const isRemedies =
    Number(consultation.amount_inr) === RS101_AMOUNT_INR ||
    (consultation.plan_title_snapshot || '').toLowerCase().includes('gem recommendation');

  if (consultation.customer_id) {
    await createInAppNotifications([
      {
        audience: 'user',
        recipientUserId: consultation.customer_id,
        type: 'consultation_confirmed',
        title: isRemedies ? 'Remedies recommendation confirmed' : 'Consultation confirmed',
        message: isRemedies
          ? `${consultation.plan_title_snapshot ?? 'Your remedies recommendation'} is confirmed (${formatChargedMoney({
              amount_inr: consultation.amount_inr,
              amount_paise: consultation.amount_paise,
              currency: consultation.currency,
            })}). Our experts will review your birth details shortly.`
          : `${consultation.plan_title_snapshot ?? 'Your consultation'} is confirmed (${formatChargedMoney({
              amount_inr: consultation.amount_inr,
              amount_paise: consultation.amount_paise,
              currency: consultation.currency,
            })}). Our team will coordinate the next steps.`,
        href: '/account',
        entityType: 'consultation',
        entityId: consultation.id,
        metadata: { plan_title: consultation.plan_title_snapshot, amount_inr: consultation.amount_inr },
      },
    ]);
  }

  return { status: 'captured', consultation, enquiryId };
}

const RECONCILE_WINDOW_MS = 21 * 24 * 60 * 60 * 1000;
const RECONCILE_LIMIT = 40;

/** Recover ₹101 / consultation bookings Razorpay captured after client-verify (or webhook) missed them. */
export async function reconcileUnfinalizedConsultationPayments(admin: Admin) {
  const since = new Date(Date.now() - RECONCILE_WINDOW_MS).toISOString();
  const { data: rows } = await admin
    .from('consultations')
    .select('*')
    .neq('payment_status', 'captured')
    .not('razorpay_order_id', 'is', null)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(RECONCILE_LIMIT);

  const lookedUp = await Promise.all(
    (rows ?? []).map(async (row) => {
      const consultation = row as Consultation;
      const orderId = consultation.razorpay_order_id;
      if (!orderId) return { consultation, facts: null };
      try {
        return { consultation, facts: await findCapturedPaymentOnOrder(orderId) };
      } catch (error) {
        console.error('[Consultation reconcile] Razorpay lookup failed for', consultation.id, error);
        return { consultation, facts: null };
      }
    })
  );

  let finalized = 0;
  for (const { consultation, facts } of lookedUp) {
    if (!facts) continue;
    try {
      const result = await applyRazorpayFactsToConsultation({
        admin,
        consultation,
        facts,
        razorpayPaymentId: facts.razorpayPaymentId,
      });
      if (result.status === 'captured') finalized += 1;
    } catch (error) {
      console.error('[Consultation reconcile] failed for', consultation.id, error);
    }
  }

  // Pending leads whose consultation already flipped to captured
  const { data: unpaidLeads } = await admin
    .from('enquiries')
    .select('id, consultation_id')
    .eq('payment_received', false)
    .not('consultation_id', 'is', null)
    .gte('created_at', since)
    .limit(40);
  const unpaidConsultIds = [
    ...new Set(
      (unpaidLeads ?? [])
        .map((row) => row.consultation_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  if (unpaidConsultIds.length) {
    const { data: paid } = await admin
      .from('consultations')
      .select('*')
      .in('id', unpaidConsultIds)
      .eq('payment_status', 'captured');
    for (const row of paid ?? []) {
      try {
        await ensureLeadFromConsultation(admin, row as Consultation);
      } catch (error) {
        console.error('[Consultation reconcile] lead flag backfill failed', error);
      }
    }
  }

  // Captured booking, no CRM lead at all (verify finalized payment then lead insert failed / never ran)
  const { data: capturedRows } = await admin
    .from('consultations')
    .select('*')
    .eq('payment_status', 'captured')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(RECONCILE_LIMIT);
  const captured = (capturedRows ?? []) as Consultation[];
  let leadsCreated = 0;
  if (captured.length) {
    const ids = captured.map((c) => c.id);
    const { data: linked } = await admin
      .from('enquiries')
      .select('consultation_id')
      .in('consultation_id', ids);
    const hasLead = new Set(
      (linked ?? [])
        .map((row) => row.consultation_id as string | null)
        .filter((id): id is string => Boolean(id))
    );
    for (const consultation of captured) {
      if (hasLead.has(consultation.id)) continue;
      try {
        await ensureLeadFromConsultation(admin, consultation);
        leadsCreated += 1;
      } catch (error) {
        console.error('[Consultation reconcile] orphan captured lead create failed', consultation.id, error);
      }
    }
  }

  return { scanned: (rows ?? []).length, finalized, leadsCreated };
}
