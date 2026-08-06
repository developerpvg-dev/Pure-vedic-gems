import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

/** Email puja / energization video + ceremony picture links (no approval flow). */
export async function sendPujaEnergizationMediaEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  videoUrl?: string | null;
  imageUrls?: string[];
}) {
  const video = (input.videoUrl || '').trim();
  const images = (input.imageUrls ?? []).filter(Boolean);
  const site = getEmailSiteUrl();

  const mediaDetails = [
    ...(video
      ? [
          {
            label: 'Puja / energization video',
            value: video,
            linkLabel: 'Watch ceremony video',
          },
        ]
      : []),
    ...images.map((url, i) => ({
      label: images.length > 1 ? `Ceremony photo ${i + 1}` : 'Ceremony photo',
      value: url,
      linkLabel: images.length > 1 ? `View photo ${i + 1}` : 'View ceremony photo',
    })),
  ];

  const firstLink = mediaDetails[0]?.value || `${site}/account/orders`;

  return sendBrandedEmail({
    to: input.to,
    subject: `Your puja / energization media — ${input.orderNumber} | PureVedicGems`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Ceremony media for order ${input.orderNumber} is ready`,
      heading: 'Your puja / energization media is ready',
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs: [
        `Your Pure Vedic Gems order ${input.orderNumber} has puja / energization media ready to view.`,
        'Open the link(s) below to watch the ceremony video and view photos.',
      ],
      highlight: { label: 'Order number', value: input.orderNumber },
      details: [
        ...mediaDetails,
        {
          label: 'Need help?',
          value: getWhatsAppUrl(
            `Hi, I have a question about the puja media for order ${input.orderNumber}`,
          ),
          linkLabel: 'Chat on WhatsApp',
        },
      ],
      cta: { label: mediaDetails[0] ? 'Open media' : 'View orders', href: firstLink },
      secondaryCta: { label: 'View my orders', href: `${site}/account/orders` },
      footerNote: 'If you did not expect this email, you can ignore it.',
    }),
  });
}
