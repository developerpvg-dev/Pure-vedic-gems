import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';
import {
  formatOrderMoney,
  type OrderChargeContext,
} from '@/lib/currency/format-charged';

/** Order is ready — ask the customer to settle the remaining balance before dispatch. */
export async function sendBalanceDueEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  note?: string | null;
  chargeContext?: OrderChargeContext | null;
}) {
  const payUrl = `${getEmailSiteUrl()}/account/orders`;
  const money = (n: number) => formatOrderMoney(n, input.chargeContext ?? null);

  return sendBrandedEmail({
    to: input.to,
    subject: `Your order is ready — ${money(input.amountDue)} balance due | ${input.orderNumber}`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Order ${input.orderNumber} is ready. Balance due ${money(input.amountDue)}.`,
      heading: 'Your Order Is Ready',
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs: [
        `Good news — your Pure Vedic Gems order ${input.orderNumber} is ready. We have received your advance of ${money(input.amountPaid)}, and the remaining balance of ${money(input.amountDue)} is now payable.`,
        ...(input.note ? [input.note] : []),
        'Sign in to your account and use Pay online or Bank transfer on this order to settle the balance. Online card payments use the same currency as your advance. Bank transfers go to our INR accounts — use the ₹ amount shown.',
      ],
      highlight: { label: 'Balance due', value: money(input.amountDue) },
      details: [
        { label: 'Order number', value: input.orderNumber },
        { label: 'Order total', value: money(input.total) },
        { label: 'Advance already paid', value: money(input.amountPaid) },
        { label: 'Balance payable now', value: money(input.amountDue) },
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
