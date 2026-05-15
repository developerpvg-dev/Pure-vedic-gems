import { getResendClient } from '@/lib/resend/client';

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'PureVedicGems <consultations@purevedicgems.com>';

type RecommendationEmailInput = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  purpose: string | null;
  recommendation: {
    rashi: string | null;
    primaryGemNames: string[];
    supportingGemNames: string[];
    advisory: string;
    notes: string[];
  };
};

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
    console.error('[Resend] Recommendation email failed:', error);
    return false;
  }
}

export async function sendRecommendationRequestEmails(input: RecommendationEmailInput) {
  if (!process.env.RESEND_API_KEY) return { customer: false, admin: false };

  const adminEmail = process.env.SALES_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;
  const primaryGems = input.recommendation.primaryGemNames.join(', ') || 'To be reviewed';
  const supportingGems = input.recommendation.supportingGemNames.join(', ') || 'To be reviewed';

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f140c">
      <h2>New gemstone recommendation request</h2>
      ${row('Lead ID', input.id)}
      ${row('Name', input.name)}
      ${row('Email', input.email)}
      ${row('Phone', input.phone)}
      ${row('Birth date', input.birthDate)}
      ${row('Birth time', input.birthTime)}
      ${row('Birth place', input.birthPlace)}
      ${row('Purpose', input.purpose)}
      ${row('Calculated rashi', input.recommendation.rashi)}
      ${row('Primary gems', primaryGems)}
      ${row('Supporting gems', supportingGems)}
      ${row('Advisory', input.recommendation.advisory)}
    </div>
  `;

  const customerHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f140c">
      <h2>We received your gemstone recommendation request</h2>
      <p>Namaste ${escapeHtml(input.name)},</p>
      <p>Thank you for sharing your details with PureVedicGems. Our Vedic experts will review your request and get back to you with the next steps.</p>
      ${row('Request ID', input.id)}
      ${row('Purpose', input.purpose)}
      ${row('Initial shortlist', primaryGems)}
      <p style="font-size:12px;color:#6b5b4d">Gemstone and astrological guidance is based on traditional practice and should not be treated as medical, legal, financial, or emergency advice.</p>
    </div>
  `;

  const [admin, customer] = await Promise.all([
    adminEmail
      ? safeSend({
          from: FROM_EMAIL,
          to: adminEmail,
          subject: `Gemstone recommendation request - ${input.name}`,
          html: adminHtml,
        })
      : Promise.resolve(false),
    safeSend({
      from: FROM_EMAIL,
      to: input.email,
      subject: 'PureVedicGems recommendation request received',
      html: customerHtml,
    }),
  ]);

  return { admin, customer };
}