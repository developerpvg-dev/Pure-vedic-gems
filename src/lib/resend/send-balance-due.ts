import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Order is ready — ask the customer to settle the remaining balance before dispatch. */
export async function sendBalanceDueEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  note?: string | null;
}) {
  const payUrl = `${getEmailSiteUrl()}/account/orders`;

  return sendBrandedEmail({
    to: input.to,
    subject: `Your order is ready — ${formatINR(input.amountDue)} balance due | ${input.orderNumber}`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Order ${input.orderNumber} is ready. Balance due ${formatINR(input.amountDue)}.`,
      heading: 'Your Order Is Ready',
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs: [
        `Good news — your Pure Vedic Gems order ${input.orderNumber} is ready. We have received your advance of ${formatINR(input.amountPaid)}, and the remaining balance of ${formatINR(input.amountDue)} is now payable.`,
        ...(input.note ? [input.note] : []),
        'Sign in to your account and use Pay online or Bank transfer on this order to settle the balance. We dispatch as soon as the balance is settled.',
      ],
      highlight: { label: 'Balance due', value: formatINR(input.amountDue) },
      details: [
        { label: 'Order number', value: input.orderNumber },
        { label: 'Order total', value: formatINR(input.total) },
        { label: 'Advance already paid', value: formatINR(input.amountPaid) },
        { label: 'Balance payable now', value: formatINR(input.amountDue) },
      ],
      cta: { label: 'Pay balance now', href: payUrl },
      secondaryCta: {
        label: 'WhatsApp support',
        href: getWhatsAppUrl(`Hi, I want to pay the balance for order ${input.orderNumber}`),
      },
      footerNote:
        'We never ask for card or UPI details over email or phone. Always pay from your PureVedicGems account.',
    }),
  });
}
