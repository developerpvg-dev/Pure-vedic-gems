import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';
import { deliveryProofPublicLink } from '@/lib/orders/dispatch-proof-token';

/** Email opaque proof links — no order UUID or storage path in the URL. */
export async function sendDeliveryProofEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  orderId: string;
  details?: string | null;
  imageCount: number;
}) {
  const greeting = `Namaste ${input.customerName || 'Valued Customer'},`;
  const site = getEmailSiteUrl();
  const count = Math.max(0, input.imageCount);
  const photoLinks = Array.from({ length: count }, (_, i) => ({
    label: `Delivery photo ${i + 1}`,
    value: deliveryProofPublicLink(input.orderId, i, site),
  }));

  return sendBrandedEmail({
    to: input.to,
    subject: `Proof of delivery — ${input.orderNumber} | PureVedicGems`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Proof of delivery for order ${input.orderNumber}`,
      heading: 'Proof of delivery',
      greeting,
      paragraphs: [
        `Your Pure Vedic Gems order ${input.orderNumber} has been delivered. Open the photo link(s) below to view proof of delivery.`,
        input.details?.trim() ? `Delivery notes: ${input.details.trim()}` : '',
      ].filter(Boolean),
      highlight: { label: 'Order Number', value: input.orderNumber },
      details: photoLinks,
      cta: {
        label: count > 0 ? 'Open delivery photo' : 'View orders',
        href: count > 0 ? photoLinks[0].value : `${site}/account/orders`,
      },
      secondaryCta: {
        label: 'WhatsApp support',
        href: getWhatsAppUrl(`Hi, I need help with order ${input.orderNumber}`),
      },
      footerNote: 'Photo links expire after 30 days and do not expose internal order identifiers.',
    }),
  });
}
