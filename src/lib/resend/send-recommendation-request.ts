import { sendBrandedEmail, sendBrandedEmailToAdmin } from '@/lib/resend/send-email';
import { getEmailSiteUrl, VEDIC_DISCLAIMER } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

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

export async function sendRecommendationRequestEmails(input: RecommendationEmailInput) {
  const primaryGems = input.recommendation.primaryGemNames.join(', ') || 'To be reviewed';
  const supportingGems = input.recommendation.supportingGemNames.join(', ') || 'To be reviewed';
  const adminUrl = `${getEmailSiteUrl()}/admin/leads?type=enquiry`;

  const [adminId, customerId] = await Promise.all([
    sendBrandedEmailToAdmin(
      `Gemstone recommendation — ${input.name}`,
      TransactionalEmail({
        preview: `Recommendation request from ${input.name}`,
        heading: 'Gemstone Recommendation Request',
        paragraphs: ['A visitor submitted the homepage gemstone recommendation form.'],
        highlight: { label: 'Lead ID', value: input.id },
        details: [
          { label: 'Name', value: input.name },
          { label: 'Email', value: input.email },
          { label: 'Phone', value: input.phone },
          { label: 'Birth date', value: input.birthDate },
          { label: 'Birth time', value: input.birthTime },
          { label: 'Birth place', value: input.birthPlace },
          { label: 'Purpose', value: input.purpose },
          { label: 'Calculated rashi', value: input.recommendation.rashi },
          { label: 'Primary gems', value: primaryGems },
          { label: 'Supporting gems', value: supportingGems },
          { label: 'Advisory', value: input.recommendation.advisory },
        ],
        cta: { label: 'Review lead', href: adminUrl },
      }),
      'consultations'
    ),
    sendBrandedEmail({
      to: input.email,
      subject: 'Recommendation request received | PureVedicGems',
      channel: 'consultations',
      react: TransactionalEmail({
        preview: 'We received your gemstone recommendation request',
        heading: 'Request Received',
        greeting: `Namaste ${input.name},`,
        paragraphs: [
          'Thank you for sharing your details with Pure Vedic Gems. Our Vedic experts will review your request and guide you on the most suitable gemstones.',
          'This is an initial shortlist based on the information provided. A senior expert will refine the recommendation before any purchase decision.',
        ],
        highlight: { label: 'Request ID', value: input.id },
        details: [
          { label: 'Purpose', value: input.purpose },
          { label: 'Initial shortlist', value: primaryGems },
          { label: 'Supporting gems', value: supportingGems },
        ],
        cta: { label: 'Browse gemstones', href: `${getEmailSiteUrl()}/shop` },
        disclaimer: VEDIC_DISCLAIMER,
      }),
    }),
  ]);

  return { admin: Boolean(adminId), customer: Boolean(customerId) };
}
