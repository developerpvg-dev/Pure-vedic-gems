import { sendBrandedEmail, sendBrandedEmailToAdmin } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

export type EnquiryEmailInput = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string;
  productId?: string | null;
};

function sourceLabel(source: string) {
  return source.replace(/_/g, ' ');
}

export async function sendEnquiryEmails(input: EnquiryEmailInput): Promise<{ customer: boolean; admin: boolean }> {
  const adminUrl = `${getEmailSiteUrl()}/admin/leads?type=enquiry`;

  const adminId = await sendBrandedEmailToAdmin(
    `New enquiry — ${input.name}`,
    TransactionalEmail({
      preview: `New enquiry from ${input.name}`,
      heading: 'New Customer Enquiry',
      paragraphs: ['A new enquiry has been submitted on the website and is awaiting review.'],
      highlight: { label: 'Enquiry ID', value: input.id },
      details: [
        { label: 'Name', value: input.name },
        { label: 'Email', value: input.email || '—' },
        { label: 'Phone', value: input.phone },
        { label: 'Subject', value: input.subject },
        { label: 'Source', value: sourceLabel(input.source) },
        { label: 'Message', value: input.message },
      ],
      cta: { label: 'Review in admin', href: adminUrl },
    }),
    'general'
  );

  if (!input.email) {
    return { customer: false, admin: Boolean(adminId) };
  }

  const customerId = await sendBrandedEmail({
    to: input.email,
    subject: 'We received your enquiry | PureVedicGems',
    channel: 'general',
    react: TransactionalEmail({
      preview: 'Thank you for contacting Pure Vedic Gems',
      heading: 'Enquiry Received',
      greeting: `Namaste ${input.name},`,
      paragraphs: [
        'Thank you for reaching out to Pure Vedic Gems. We have received your message and our team will respond within one business day.',
        'For urgent gemstone or consultation support, you may also reach us on WhatsApp using the button below.',
      ],
      highlight: { label: 'Reference ID', value: input.id },
      details: [
        { label: 'Subject', value: input.subject ?? 'General enquiry' },
        { label: 'Your message', value: input.message },
      ],
      cta: { label: 'Continue browsing', href: getEmailSiteUrl() },
      secondaryCta: {
        label: 'Chat on WhatsApp',
        href: getWhatsAppUrl(`Hi, I submitted an enquiry (ref: ${input.id})`),
      },
      footerNote: 'You received this email because you submitted an enquiry on PureVedicGems.',
    }),
  });

  return { customer: Boolean(customerId), admin: Boolean(adminId) };
}
