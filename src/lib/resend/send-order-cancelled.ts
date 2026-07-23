import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

export async function sendOrderCancelledEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  reason?: string | null;
  cancelledBy?: 'customer' | 'admin';
}) {
  const site = getEmailSiteUrl();
  const byCustomer = input.cancelledBy === 'customer';

  return sendBrandedEmail({
    to: input.to,
    subject: `Order cancelled — ${input.orderNumber} | PureVedicGems`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Your order ${input.orderNumber} has been cancelled`,
      heading: 'Order cancelled',
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs: [
        byCustomer
          ? `Your Pure Vedic Gems order ${input.orderNumber} has been cancelled as requested.`
          : `Your Pure Vedic Gems order ${input.orderNumber} has been cancelled.`,
        input.reason
          ? `Reason: ${input.reason}`
          : 'If a payment was already made, our team will process any applicable refund.',
        'Need help or want to place a new order? Reach us anytime on WhatsApp or from your account.',
      ],
      highlight: { label: 'Order Number', value: input.orderNumber },
      details: [
        { label: 'Status', value: 'Cancelled' },
        ...(input.reason ? [{ label: 'Reason', value: input.reason }] : []),
      ],
      cta: { label: 'View your orders', href: `${site}/account/orders` },
      secondaryCta: {
        label: 'WhatsApp support',
        href: getWhatsAppUrl(`Hi, I need help regarding cancelled order ${input.orderNumber}`),
      },
      footerNote: 'This is a transactional update for your PureVedicGems order.',
    }),
  });
}
