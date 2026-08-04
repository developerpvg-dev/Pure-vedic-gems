import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';
import { ringSizeConfirmPublicLink } from '@/lib/orders/ring-size-confirmation-token';
import { RING_SIZE_CONFIRM_COPY } from '@/lib/orders/ring-size-confirmation';

/** Ask customer to re-upload ring diameter photo with admin guidance. */
export async function sendRingSizeReuploadEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  orderId: string;
  round: number;
  adminRemarks: string;
}) {
  const uploadUrl = ringSizeConfirmPublicLink(input.orderId, input.round);
  const roundNote = input.round > 1 ? ` (revision ${input.round})` : '';

  return sendBrandedEmail({
    to: input.to,
    subject: `Please re-upload your ring diameter photo — ${input.orderNumber} | PureVedicGems`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `We need a clearer ring diameter photo for order ${input.orderNumber}`,
      heading: 'Ring diameter photo — please try again',
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs: [
        `For your Pure Vedic Gems order ${input.orderNumber}${roundNote}, we need a clearer internal-diameter photo before we continue crafting.`,
        `What to fix: ${input.adminRemarks}`,
        RING_SIZE_CONFIRM_COPY,
      ],
      highlight: { label: 'Order number', value: input.orderNumber },
      details: [
        { label: 'Revision', value: String(input.round) },
        {
          label: 'Need help?',
          value: getWhatsAppUrl(
            `Hi, I need help with the ring diameter photo for order ${input.orderNumber}`,
          ),
          linkLabel: 'Chat on WhatsApp',
        },
      ],
      cta: { label: 'Upload new diameter photo', href: uploadUrl },
      footerNote:
        'This upload link expires after 30 days. If you did not expect this email, you can ignore it.',
    }),
  });
}
