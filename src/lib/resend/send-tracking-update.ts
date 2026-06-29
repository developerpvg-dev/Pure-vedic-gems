import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

export async function sendTrackingUpdateEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  status: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: string | null;
}) {
  const greeting = `Namaste ${input.customerName || 'Valued Customer'},`;
  const statusLabel = input.status.replace(/_/g, ' ');
  const trackPage = `${getEmailSiteUrl()}/account/orders`;

  return sendBrandedEmail({
    to: input.to,
    subject: `Tracking update — ${input.orderNumber} | PureVedicGems`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Your order ${input.orderNumber} status: ${statusLabel}`,
      heading: 'Shipment Update',
      greeting,
      paragraphs: [
        `Your Pure Vedic Gems order is now marked as ${statusLabel}. Our team is preparing your certified gemstones with the utmost care.`,
        'You can review the latest tracking details below and follow progress from your account at any time.',
      ],
      highlight: { label: 'Order Number', value: input.orderNumber },
      details: [
        { label: 'Current status', value: statusLabel },
        { label: 'Carrier', value: input.carrier },
        { label: 'Tracking number', value: input.trackingNumber },
        {
          label: 'Estimated delivery',
          value: input.estimatedDelivery
            ? new Date(input.estimatedDelivery).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : null,
        },
        { label: 'Tracking link', value: input.trackingUrl },
      ],
      cta: input.trackingUrl
        ? { label: 'Track your package', href: input.trackingUrl }
        : { label: 'View order status', href: trackPage },
      secondaryCta: {
        label: 'WhatsApp support',
        href: getWhatsAppUrl(`Hi, I need help with order ${input.orderNumber}`),
      },
      footerNote: 'This is a transactional update for your PureVedicGems order.',
    }),
  });
}
