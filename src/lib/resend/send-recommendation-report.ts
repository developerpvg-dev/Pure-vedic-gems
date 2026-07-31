import { createElement } from 'react';
import { sendBrandedEmail } from '@/lib/resend/send-email';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';
import { getEmailSiteUrl, VEDIC_DISCLAIMER } from '@/lib/resend/email-config';

export async function sendRecommendationReportEmail(opts: {
  to: string;
  customerName: string;
  reportTitle: string;
  publicToken: string;
  pdfBuffer?: Buffer | null;
}) {
  const reportUrl = `${getEmailSiteUrl()}/r/${opts.publicToken}`;
  const name = opts.customerName.trim() || 'there';

  return sendBrandedEmail({
    to: opts.to,
    subject: `Your gemstone recommendation — PureVedicGems`,
    channel: 'consultations',
    react: createElement(TransactionalEmail, {
      preview: 'Your personalized gemstone recommendation is ready',
      heading: 'Your Gemstone Recommendation',
      greeting: `Dear ${name},`,
      paragraphs: [
        'Our astrologers have prepared your personalized gemstone recommendation report.',
        'You can view it online using the button below. A PDF copy is attached when available.',
      ],
      highlight: { label: 'Report', value: opts.reportTitle },
      cta: { label: 'View Recommendation', href: reportUrl },
      disclaimer: VEDIC_DISCLAIMER,
    }),
    attachments: opts.pdfBuffer
      ? [
          {
            filename: `purevedicgems-recommendation.pdf`,
            content: opts.pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined,
  });
}
