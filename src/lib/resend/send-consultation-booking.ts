import { getResendClient } from '@/lib/resend/client';

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'PureVedicGems <consultations@purevedicgems.com>';

export interface PaidConsultationEmailInput {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  plan_title: string;
  plan_description: string | null;
  amount_inr: number | null;
  currency: string;
  razorpay_payment_id: string | null;
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

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function money(amount: number | null, currency: string) {
  if (amount == null) return currency;
  return `${currency} ${amount.toLocaleString('en-IN')}`;
}

function row(label: string, value: string | number | null | undefined) {
  if (value == null || value === '') return '';
  return `<p style="margin:0 0 8px"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

async function safeSend(args: Parameters<ReturnType<typeof getResendClient>['emails']['send']>[0]) {
  try {
    const resend = getResendClient();
    await resend.emails.send(args);
    return true;
  } catch (error) {
    console.error('[Resend] Consultation email failed:', error);
    return false;
  }
}

export async function sendConsultationBookingEmails(input: PaidConsultationEmailInput): Promise<ConsultationEmailResult> {
  if (!process.env.RESEND_API_KEY) return { customer: false, admin: false };

  const adminEmail = process.env.SALES_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;
  const amount = money(input.amount_inr, input.currency);

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f140c">
      <h2>Paid consultation booking</h2>
      ${row('Booking ID', input.id)}
      ${row('Name', input.full_name)}
      ${row('Email', input.email)}
      ${row('Phone', input.phone)}
      ${row('Plan', input.plan_title)}
      ${row('Amount', amount)}
      ${row('Payment ID', input.razorpay_payment_id)}
      ${row('Preferred date', input.preferred_date)}
      ${row('Preferred time', input.preferred_time)}
      ${row('Date of birth', input.date_of_birth)}
      ${row('Birth time', input.birth_time)}
      ${row('Birth place', input.birth_place)}
      ${row('Life situation', input.life_situation)}
      ${row('Customer message', input.message)}
      ${row('Status', input.status)}
      ${row('Details', input.plan_description)}
    </div>
  `;

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f140c">
      <h2>Your PureVedicGems consultation is booked</h2>
      <p>Namaste ${escapeHtml(input.full_name)},</p>
      <p>Thank you for booking a paid consultation with PureVedicGems. Your payment has been verified and your booking is now visible in your account dashboard.</p>
      ${row('Booking ID', input.id)}
      ${row('Plan', input.plan_title)}
      ${row('Amount paid', amount)}
      ${row('Payment ID', input.razorpay_payment_id)}
      ${row('Preferred date', input.preferred_date)}
      ${row('Preferred time', input.preferred_time)}
      ${row('Date of birth', input.date_of_birth)}
      ${row('Birth time', input.birth_time)}
      ${row('Birth place', input.birth_place)}
      ${row('Life situation', input.life_situation)}
      ${row('Your message', input.message)}
      <p style="font-size:12px;color:#6b5b4d">Gemstone and astrological guidance is based on traditional practice and should not be treated as medical, legal, financial, or emergency advice.</p>
    </div>
  `;

  const [admin, customer] = await Promise.all([
    adminEmail
      ? safeSend({
          from: FROM_EMAIL,
          to: adminEmail,
          subject: `Paid consultation booked - ${input.full_name}`,
          html: adminHtml,
        })
      : Promise.resolve(false),
    safeSend({
      from: FROM_EMAIL,
      to: input.email,
      subject: 'PureVedicGems consultation booking confirmed',
      html: customerHtml,
    }),
  ]);

  return { admin, customer };
}

export async function sendConsultationScheduledEmail(input: PaidConsultationEmailInput): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;

  const scheduledMode = input.scheduled_mode ? input.scheduled_mode.replace(/_/g, ' ') : null;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f140c">
      <h2>Your PureVedicGems consultation schedule is confirmed</h2>
      <p>Namaste ${escapeHtml(input.full_name)},</p>
      <p>Our team has scheduled your paid consultation. Please keep the details below handy.</p>
      ${row('Booking ID', input.id)}
      ${row('Plan', input.plan_title)}
      ${row('Scheduled date', input.scheduled_date)}
      ${row('Scheduled time', input.scheduled_time)}
      ${row('Mode', scheduledMode)}
      ${row('Meeting link / venue', input.meeting_link)}
      ${row('Additional notes', input.admin_schedule_notes)}
      ${row('Preferred date', input.preferred_date)}
      ${row('Preferred time', input.preferred_time)}
      <p style="font-size:12px;color:#6b5b4d">For any changes, reply to this email with your booking ID.</p>
    </div>
  `;

  return safeSend({
    from: FROM_EMAIL,
    to: input.email,
    subject: 'PureVedicGems consultation schedule confirmed',
    html,
  });
}

export async function sendConsultationCompletedEmail(input: PaidConsultationEmailInput): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f140c">
      <h2>Your PureVedicGems consultation is completed</h2>
      <p>Namaste ${escapeHtml(input.full_name)},</p>
      <p>Your consultation has been marked as completed by our team. Thank you for trusting PureVedicGems for your Vedic guidance.</p>
      ${row('Booking ID', input.id)}
      ${row('Plan', input.plan_title)}
      ${row('Payment ID', input.razorpay_payment_id)}
      <p style="font-size:12px;color:#6b5b4d">For follow-up support, reply to this email with your booking ID.</p>
    </div>
  `;

  return safeSend({
    from: FROM_EMAIL,
    to: input.email,
    subject: 'PureVedicGems consultation completed',
    html,
  });
}