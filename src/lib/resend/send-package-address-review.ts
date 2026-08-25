import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';
import { packageAddressReviewPublicLink } from '@/lib/orders/package-address-review-token';

/** Email packing + address-label photos + confirm / report-issue links. */
export async function sendPackageAddressReviewEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  orderId: string;
  round: number;
  imageUrls: string[];
}) {
  const approveUrl = packageAddressReviewPublicLink(input.orderId, input.round, 'approve');
  const changesUrl = packageAddressReviewPublicLink(input.orderId, input.round, 'changes');
  const roundNote = input.round > 1 ? ` (update ${input.round})` : '';
  const images = input.imageUrls.filter(Boolean);

  return sendBrandedEmail({
    to: input.to,
    subject: `Confirm your package & address — ${input.orderNumber} | PureVedicGems`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Please confirm the packed package and shipping address for order ${input.orderNumber}`,
      heading: 'Confirm package & address',
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs: [
        `Your Pure Vedic Gems order ${input.orderNumber}${roundNote} is packed for shipping. Please check the photos of the package and the address written on it.`,
        'Confirm if everything looks correct, or report an address issue and leave a short note so we can correct it before dispatch.',
        'Please download or save any packing images you need — shared packing images are deleted after 7 days.',
      ],
      highlight: { label: 'Order number', value: input.orderNumber },
      details: [
        ...images.map((url, i) => ({
          label: images.length > 1 ? `Packing photo ${i + 1}` : 'Packing photo',
          value: url,
          linkLabel: images.length > 1 ? `View photo ${i + 1}` : 'View packing photo',
        })),
        { label: 'Review round', value: String(input.round) },
        {
          label: 'Need help?',
          value: getWhatsAppUrl(
            `Hi, I have feedback on the packing / address for order ${input.orderNumber}`,
          ),
          linkLabel: 'Chat on WhatsApp',
        },
      ],
      cta: { label: 'Confirm package & address', href: approveUrl },
      secondaryCta: { label: 'Report address issue', href: changesUrl },
      footerNote:
        'Packing images are deleted after 7 days. Review links expire after 30 days. If you did not expect this email, you can ignore it.',
    }),
  });
}
