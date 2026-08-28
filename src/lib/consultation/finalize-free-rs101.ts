import type { createAdminClient } from '@/lib/supabase/admin';
import type { Consultation } from '@/lib/types/database';
import { ensureLeadFromConsultation } from '@/lib/leads/from-consultation';
import { sendConsultationBookingEmails } from '@/lib/resend/send-consultation-booking';
import { createInAppNotifications } from '@/lib/notifications/in-app';

type Admin = ReturnType<typeof createAdminClient>;

/** International rs101 — no Razorpay; emails + CRM after insert. */
export async function finalizeFreeRs101Consultation(
  admin: Admin,
  consultation: Consultation,
  ipLocation?: string | null
) {
  if (!consultation.confirmation_email_sent_at || !consultation.admin_notification_sent_at) {
    const sent = await sendConsultationBookingEmails({
      id: consultation.id,
      full_name: consultation.full_name,
      email: consultation.email,
      phone: consultation.phone,
      plan_title: consultation.plan_title_snapshot ?? 'Gem Recommendation',
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
    if (sent.customer && !consultation.confirmation_email_sent_at) {
      emailUpdate.confirmation_email_sent_at = now;
    }
    if (sent.admin && !consultation.admin_notification_sent_at) {
      emailUpdate.admin_notification_sent_at = now;
    }
    if (Object.keys(emailUpdate).length > 0) {
      await admin.from('consultations').update(emailUpdate).eq('id', consultation.id);
    }
  }

  let enquiryId: string | null = null;
  try {
    enquiryId = await ensureLeadFromConsultation(admin, consultation, { ipLocation });
  } catch (error) {
    console.error('[Consultation rs101 free] CRM lead create failed:', error);
  }

  if (consultation.customer_id) {
    await createInAppNotifications([
      {
        audience: 'user',
        recipientUserId: consultation.customer_id,
        type: 'consultation_confirmed',
        title: 'Remedies recommendation booked',
        message: 'Your remedies recommendation request is confirmed.',
        href: '/account/consultations',
        entityType: 'consultation',
        entityId: consultation.id,
        metadata: { plan_title: consultation.plan_title_snapshot },
      },
    ]);
  }

  return enquiryId;
}
