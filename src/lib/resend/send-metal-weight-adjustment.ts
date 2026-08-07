import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';
import type { MetalWeightAdjustKind } from '@/lib/orders/metal-weight-adjust';
import {
  formatOrderMoney,
  type OrderChargeContext,
} from '@/lib/currency/format-charged';

/** Notify customer that actual metal weight changed the order total. */
export async function sendMetalWeightAdjustmentEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  itemName?: string | null;
  oldWeightGrams: number;
  newWeightGrams: number;
  kind: MetalWeightAdjustKind;
  totalDelta: number;
  orderTotal: number;
  amountPaid: number;
  amountDue: number;
  refundDue: number;
  note?: string | null;
  chargeContext?: OrderChargeContext | null;
}) {
  const money = (n: number) => formatOrderMoney(n, input.chargeContext ?? null);
  const accountUrl = `${getEmailSiteUrl()}/account/orders`;
  const weightLine = `${input.oldWeightGrams} g → ${input.newWeightGrams} g`;
  const itemBit = input.itemName ? ` for ${input.itemName}` : '';

  const isRefund = input.kind === 'refund' || input.refundDue > 0.009;
  const isExtra = !isRefund && (input.kind === 'extra_charge' || input.totalDelta > 0.009);

  const heading = isRefund
    ? 'Metal Weight Updated — Credit / Refund'
    : isExtra
      ? 'Metal Weight Updated — Extra Amount Due'
      : 'Metal Weight Updated';

  const paragraphs: string[] = [
    `Your Pure Vedic Gems order ${input.orderNumber}${itemBit} has been updated with the actual metal weight used in making (${weightLine}).`,
  ];

  if (isRefund) {
    const refund = input.refundDue > 0.009 ? input.refundDue : Math.abs(input.totalDelta);
    paragraphs.push(
      input.refundDue > 0.009
        ? `Because less metal was used than quoted, ${money(refund)} will be refunded to you. Our team will process the refund shortly.`
        : `Because less metal was used than quoted, your order total has been reduced by ${money(refund)}. Your remaining balance is now ${money(input.amountDue)}.`,
    );
  } else if (isExtra) {
    paragraphs.push(
      `Because more metal was used than quoted, the order total increased by ${money(Math.abs(input.totalDelta))}.`,
      input.amountDue > 0.009
        ? `Please pay the remaining balance of ${money(input.amountDue)} from your account to continue fulfillment.`
        : 'Your payment already covers the updated total.',
    );
  } else {
    paragraphs.push('There is no change to the amount payable for this update.');
  }

  if (input.note) paragraphs.push(input.note);

  return sendBrandedEmail({
    to: input.to,
    subject: `${heading} | ${input.orderNumber}`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `${input.orderNumber}: metal weight ${weightLine}.`,
      heading,
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs,
      highlight: isRefund
        ? {
            label: input.refundDue > 0.009 ? 'Refund due' : 'Amount reduced',
            value: money(input.refundDue > 0.009 ? input.refundDue : Math.abs(input.totalDelta)),
          }
        : isExtra && input.amountDue > 0.009
          ? { label: 'Balance due', value: money(input.amountDue) }
          : { label: 'Metal weight', value: `${input.newWeightGrams} g` },
      details: [
        { label: 'Order number', value: input.orderNumber },
        { label: 'Metal weight', value: weightLine },
        { label: 'Updated order total', value: money(input.orderTotal) },
        { label: 'Amount paid', value: money(input.amountPaid) },
        { label: 'Balance due', value: money(input.amountDue) },
        ...(input.refundDue > 0.009
          ? [{ label: 'Refund due', value: money(input.refundDue) }]
          : []),
      ],
      cta:
        isExtra && input.amountDue > 0.009
          ? { label: 'Pay balance now', href: accountUrl }
          : { label: 'View your orders', href: accountUrl },
      secondaryCta: {
        label: 'WhatsApp support',
        href: getWhatsAppUrl(`Hi, I have a question about the metal weight update on order ${input.orderNumber}`),
      },
      footerNote:
        'Metal weight is finalized after the piece is made. We never ask for card or UPI details over email or phone.',
    }),
  });
}
