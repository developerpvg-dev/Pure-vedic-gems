import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

export async function sendBankTransferReceivedEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  orderId: string;
  bankLabel: string;
  reference: string;
  isLoggedInCustomer?: boolean;
  isResubmit?: boolean;
}) {
  const site = getEmailSiteUrl();
  const viewHref = input.isLoggedInCustomer
    ? `${site}/account/orders`
    : `${site}/order-confirmation/${input.orderId}`;

  return sendBrandedEmail({
    to: input.to,
    subject: `We received your bank transfer — ${input.orderNumber} | PureVedicGems`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Order ${input.orderNumber}: we will review and confirm within 24 hours`,
      heading: input.isResubmit ? 'Updated proof received' : 'Bank transfer received',
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs: [
        input.isResubmit
          ? `We received your updated bank transfer details for order ${input.orderNumber}.`
          : `Thank you. We received your bank transfer proof for order ${input.orderNumber}.`,
        'Our team will review your payment and confirm the order within 24 hours. You will get another email once it is verified.',
        'You can track this order anytime from your PureVedicGems account or the order page.',
      ],
      highlight: { label: 'Order Number', value: input.orderNumber },
      details: [
        { label: 'Bank', value: input.bankLabel },
        { label: 'UTR / reference', value: input.reference },
        { label: 'What happens next', value: 'Review & confirmation within 24 hours' },
      ],
      cta: { label: 'View your order', href: viewHref },
      secondaryCta: {
        label: 'WhatsApp support',
        href: getWhatsAppUrl(`Hi, I submitted a bank transfer for order ${input.orderNumber}`),
      },
      footerNote: 'This is a transactional update for your PureVedicGems order.',
    }),
  });
}
