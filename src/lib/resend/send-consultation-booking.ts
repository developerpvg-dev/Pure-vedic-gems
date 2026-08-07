import { sendBrandedEmail, sendBrandedEmailToAdmin } from '@/lib/resend/send-email';
import { getEmailSiteUrl, VEDIC_DISCLAIMER } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';
import { formatChargedMoney } from '@/lib/currency/format-charged';
import type { ConsultationCreateInput } from '@/lib/validators/consultation';

export interface PaidConsultationEmailInput {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  plan_title: string;
  plan_description: string | null;
  amount_inr: number | null;
  /** Gateway minor units when charged in a non-INR currency. */
  amount_paise?: number | null;
  currency: string;
  razorpay_payment_id: string | null;
  mode?: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
  life_situation?: string | null;
  message?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  scheduled_mode?: string | null;
  meeting_link?: string | null;
  admin_schedule_notes?: string | null;
  status: string;
}

export interface ConsultationEmailResult {
  customer: boolean;
  admin: boolean;
}

function isRs101Booking(input: PaidConsultationEmailInput) {
  const title = (input.plan_title || '').toLowerCase();
  return Number(input.amount_inr) === RS101_AMOUNT_INR || title.includes('gem recommendation');
}

function consultationDetails(input: PaidConsultationEmailInput) {
  return [
    { label: 'Booking ID', value: input.id },
    { label: 'Service', value: 'Vedic Consultation' },
    { label: 'Plan', value: input.plan_title },
    { label: 'Mode', value: input.mode },
    { label: 'Amount', value: formatChargedMoney(input) },
    { label: 'Payment ID', value: input.razorpay_payment_id },
    { label: 'Preferred date', value: input.preferred_date },
    { label: 'Preferred time', value: input.preferred_time },
    { label: 'Date of birth', value: input.date_of_birth },
    { label: 'Birth time', value: input.birth_time },
    { label: 'Birth place', value: input.birth_place },
    { label: 'Life situation', value: input.life_situation },
    { label: 'Your message', value: input.message },
    { label: 'Status', value: input.status.replace(/_/g, ' ') },
    { label: 'Plan details', value: input.plan_description },
  ];
}

export async function sendConsultationBookingEmails(input: PaidConsultationEmailInput): Promise<ConsultationEmailResult> {
  const accountUrl = `${getEmailSiteUrl()}/account/consultations`;
  const adminUrl = `${getEmailSiteUrl()}/admin/leads?type=consultation`;
  const remedies = isRs101Booking(input);

  const [adminId, customerId] = await Promise.all([
    sendBrandedEmailToAdmin(
      remedies
        ? `Remedies recommendation booked — ${input.full_name}`
        : `Vedic Consultation booked — ${input.full_name}`,
      TransactionalEmail({
        preview: remedies
          ? `Remedies recommendation from ${input.full_name}`
          : `Vedic Consultation from ${input.full_name}`,
        heading: remedies ? 'Remedies Recommendation Booked' : 'Vedic Consultation Booked',
        paragraphs: [
          remedies
            ? `A remedies recommendation payment (${formatChargedMoney(input)}) has been verified. Please assign a telecaller and review birth details.`
            : `A Vedic Consultation payment (${formatChargedMoney(input)}) has been verified for plan: ${input.plan_title}. Please review birth details and coordinate scheduling.`,
        ],
        highlight: { label: 'Booking ID', value: input.id },
        details: [
          { label: 'Name', value: input.full_name },
          { label: 'Email', value: input.email },
          { label: 'Phone', value: input.phone },
          ...consultationDetails(input).slice(1),
        ],
        cta: { label: remedies ? 'Open remedies lead' : 'Open consultation lead', href: adminUrl },
      }),
      'consultations'
    ),
    sendBrandedEmail({
      to: input.email,
      subject: remedies
        ? 'Remedies recommendation confirmed | PureVedicGems'
        : 'Vedic Consultation confirmed | PureVedicGems',
      channel: 'consultations',
      react: TransactionalEmail({
        preview: remedies
          ? 'Your Pure Vedic Gems remedies recommendation is confirmed'
          : 'Your Pure Vedic Gems Vedic Consultation is booked',
        heading: remedies ? 'Remedies Recommendation Confirmed' : 'Vedic Consultation Confirmed',
        greeting: `Namaste ${input.full_name},`,
        paragraphs: remedies
          ? [
              'Thank you for requesting a remedies recommendation with Pure Vedic Gems. Your payment has been verified and your booking is now visible in your account dashboard.',
              'Our Vedic experts will review your birth details and share your personalized gemstone recommendation.',
            ]
          : [
              'Thank you for booking a Vedic Consultation with Pure Vedic Gems. Your payment has been verified and your booking is now visible in your account dashboard.',
              `Plan booked: ${input.plan_title}${input.plan_description ? ` — ${input.plan_description}` : ''}`,
              'Our experts will review your birth details and contact you to confirm the final schedule.',
            ],
        highlight: { label: 'Booking ID', value: input.id },
        details: consultationDetails(input),
        cta: { label: remedies ? 'View my booking' : 'View my consultations', href: accountUrl },
        disclaimer: VEDIC_DISCLAIMER,
      }),
    }),
  ]);

  return { customer: Boolean(customerId), admin: Boolean(adminId) };
}

export async function sendConsultationScheduledEmail(input: PaidConsultationEmailInput): Promise<boolean> {
  const scheduledMode = input.scheduled_mode ? input.scheduled_mode.replace(/_/g, ' ') : null;

  const messageId = await sendBrandedEmail({
    to: input.email,
    subject: 'Consultation schedule confirmed | PureVedicGems',
    channel: 'consultations',
    react: TransactionalEmail({
      preview: 'Your consultation schedule is confirmed',
      heading: 'Consultation Scheduled',
      greeting: `Namaste ${input.full_name},`,
      paragraphs: [
        'Our team has confirmed your consultation schedule. Please keep the details below handy and join on time if your session is online.',
        'For any changes, reply to this email with your booking ID.',
      ],
      highlight: { label: 'Booking ID', value: input.id },
      details: [
        { label: 'Plan', value: input.plan_title },
        { label: 'Scheduled date', value: input.scheduled_date },
        { label: 'Scheduled time', value: input.scheduled_time },
        { label: 'Mode', value: scheduledMode },
        { label: 'Meeting link / venue', value: input.meeting_link },
        { label: 'Notes from our team', value: input.admin_schedule_notes },
      ],
      cta: input.meeting_link ? { label: 'Join meeting', href: input.meeting_link } : undefined,
      disclaimer: VEDIC_DISCLAIMER,
    }),
  });

  return Boolean(messageId);
}

export async function sendConsultationCompletedEmail(input: PaidConsultationEmailInput): Promise<boolean> {
  const messageId = await sendBrandedEmail({
    to: input.email,
    subject: 'Consultation completed | PureVedicGems',
    channel: 'consultations',
    react: TransactionalEmail({
      preview: 'Your Pure Vedic Gems consultation is complete',
      heading: 'Consultation Completed',
      greeting: `Namaste ${input.full_name},`,
      paragraphs: [
        'Your consultation has been marked as completed by our team. Thank you for trusting Pure Vedic Gems for your Vedic guidance.',
        'If you need follow-up support or gemstone recommendations, our experts remain at your service.',
      ],
      highlight: { label: 'Booking ID', value: input.id },
      details: [
        { label: 'Plan', value: input.plan_title },
        { label: 'Payment ID', value: input.razorpay_payment_id },
      ],
      cta: { label: 'Explore gemstones', href: `${getEmailSiteUrl()}/shop` },
      disclaimer: VEDIC_DISCLAIMER,
    }),
  });

  return Boolean(messageId);
}

export async function sendConsultationRequestEmails(input: ConsultationCreateInput & { id: string }) {
  const adminUrl = `${getEmailSiteUrl()}/admin/leads?type=consultation`;

  const [adminId, customerId] = await Promise.all([
    sendBrandedEmailToAdmin(
      `Consultation request — ${input.full_name}`,
      TransactionalEmail({
        preview: `Consultation request from ${input.full_name}`,
        heading: 'New Consultation Request',
        paragraphs: ['A consultation request has been submitted and needs scheduling follow-up.'],
        highlight: { label: 'Request ID', value: input.id },
        details: [
          { label: 'Name', value: input.full_name },
          { label: 'Email', value: input.email },
          { label: 'Phone', value: input.phone },
          { label: 'Type', value: input.consultation_type },
          { label: 'Mode', value: input.mode },
          { label: 'Preferred date', value: input.preferred_date },
          { label: 'Preferred time', value: input.preferred_time },
          { label: 'Birth date', value: input.date_of_birth },
          { label: 'Birth time', value: input.birth_time },
          { label: 'Birth place', value: input.birth_place },
          { label: 'Life situation', value: input.life_situation },
          { label: 'Message', value: input.message },
        ],
        cta: { label: 'Review request', href: adminUrl },
      }),
      'consultations'
    ),
    sendBrandedEmail({
      to: input.email,
      subject: 'Consultation request received | PureVedicGems',
      channel: 'consultations',
      react: TransactionalEmail({
        preview: 'We received your consultation request',
        heading: 'Request Received',
        greeting: `Namaste ${input.full_name},`,
        paragraphs: [
          'Thank you for requesting a Vedic consultation with Pure Vedic Gems. Our team will review your details and contact you within 24 hours to confirm the next available slot.',
        ],
        highlight: { label: 'Request ID', value: input.id },
        disclaimer: VEDIC_DISCLAIMER,
      }),
    }),
  ]);

  return { customer: Boolean(customerId), admin: Boolean(adminId) };
}
