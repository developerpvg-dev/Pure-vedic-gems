import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

export async function sendBankTransferRejectedEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  orderId: string;
  rejectReason: string;
  isLoggedInCustomer?: boolean;
}) {
  const site = getEmailSiteUrl();
  const resubmitHref = input.isLoggedInCustomer
    ? `${site}/account/orders`
    : `${site}/order-confirmation/${input.orderId}`;
  const trackHref = `${site}/track-order`;

  return sendBrandedEmail({
    to: input.to,
    subject: `Payment proof needs an update — ${input.orderNumber} | PureVedicGems`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `We could not verify the bank transfer for order ${input.orderNumber}`,
      heading: 'Bank transfer needs a correction',
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs: [
        `We reviewed the bank transfer proof for order ${input.orderNumber} and could not match it to your payment yet.`,
        'Please update the UTR / reference and upload a clearer screenshot, then resubmit for verification. Your order stays reserved while you fix this.',
      ],
      highlight: { label: 'Order Number', value: input.orderNumber },
      details: [
        { label: 'Why it was rejected', value: input.rejectReason },
        { label: 'What to do next', value: 'Edit transfer details + proof, then submit again for review.' },
      ],
      cta: { label: 'Update payment proof', href: resubmitHref },
      secondaryCta: {
        label: 'Track order',
        href: trackHref,
      },
      footerNote: `Need help? WhatsApp us: ${getWhatsAppUrl(`Hi, I need help updating bank transfer proof for order ${input.orderNumber}`)}`,
    }),
  });
}
