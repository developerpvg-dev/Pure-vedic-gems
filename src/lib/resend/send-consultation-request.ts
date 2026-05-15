import { getResendClient } from '@/lib/resend/client';
import type { ConsultationCreateInput } from '@/lib/validators/consultation';

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'PureVedicGems <consultations@purevedicgems.com>';

function escapeHtml(value: string | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function row(label: string, value: string | null | undefined) {
  if (!value) return '';
  return `<p style="margin:0 0 8px"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

export async function sendConsultationRequestEmails(input: ConsultationCreateInput & { id: string }) {
  if (!process.env.RESEND_API_KEY) return;

  const resend = getResendClient();
  const adminEmail = process.env.SALES_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;
  const requestHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f140c">
      <h2>New consultation request</h2>
      ${row('Request ID', input.id)}
      ${row('Name', input.full_name)}
      ${row('Email', input.email)}
      ${row('Phone', input.phone)}
      ${row('Type', input.consultation_type)}
      ${row('Mode', input.mode)}
      ${row('Preferred date', input.preferred_date)}
      ${row('Preferred time', input.preferred_time)}
      ${row('Birth date', input.date_of_birth)}
      ${row('Birth time', input.birth_time)}
      ${row('Birth place', input.birth_place)}
      ${row('Life situation', input.life_situation)}
      ${row('Message', input.message)}
    </div>
  `;

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f140c">
      <h2>We received your PureVedicGems consultation request</h2>
      <p>Namaste ${escapeHtml(input.full_name)},</p>
      <p>Thank you for requesting a Vedic consultation. Our team will review your details and contact you within 24 hours to confirm the next available slot.</p>
      <p><strong>Request ID:</strong> ${escapeHtml(input.id)}</p>
      <p style="font-size:12px;color:#6b5b4d">Gemstone and astrological guidance is based on traditional practice and should not be treated as medical, legal, or financial advice.</p>
    </div>
  `;

  const tasks = [];

  if (adminEmail) {
    tasks.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `New consultation request - ${input.full_name}`,
        html: requestHtml,
      })
    );
  }

  tasks.push(
    resend.emails.send({
      from: FROM_EMAIL,
      to: input.email,
      subject: 'PureVedicGems consultation request received',
      html: customerHtml,
    })
  );

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[Resend] Consultation email failed:', result.reason);
    }
  }
}