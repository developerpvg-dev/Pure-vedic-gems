import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getWhatsAppUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';
import { productVideoReviewPublicLink } from '@/lib/orders/product-video-review-token';

/** Email product video(s) / image(s) + approve / request-changes links. */
export async function sendProductVideoReviewEmail(input: {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  orderId: string;
  round: number;
  videoUrl: string;
  videoUrls?: string[];
  imageUrls?: string[];
}) {
  const approveUrl = productVideoReviewPublicLink(input.orderId, input.round, 'approve');
  const changesUrl = productVideoReviewPublicLink(input.orderId, input.round, 'changes');
  const roundNote =
    input.round > 1 ? ` (revision ${input.round})` : '';

  const videos = (input.videoUrls?.length ? input.videoUrls : [input.videoUrl]).filter(Boolean);
  const images = input.imageUrls ?? [];

  const mediaDetails = [
    ...videos.map((url, i) => ({
      label: videos.length > 1 ? `Product video ${i + 1}` : 'Product video',
      value: url,
      linkLabel: videos.length > 1 ? `Watch video ${i + 1}` : 'Watch product video',
    })),
    ...images.map((url, i) => ({
      label: images.length > 1 ? `Product image ${i + 1}` : 'Product image',
      value: url,
      linkLabel: images.length > 1 ? `View image ${i + 1}` : 'View product image',
    })),
  ];

  return sendBrandedEmail({
    to: input.to,
    subject: `Please review your product design — ${input.orderNumber} | PureVedicGems`,
    channel: 'orders',
    react: TransactionalEmail({
      preview: `Your product media for order ${input.orderNumber} is ready for approval`,
      heading: 'Review your product design',
      greeting: `Namaste ${input.customerName || 'Valued Customer'},`,
      paragraphs: [
        `Your Pure Vedic Gems order ${input.orderNumber}${roundNote} has product media ready. Please review it and tell us if you are satisfied with the design.`,
        'Approve if everything looks good, or request changes and share a short note about what to adjust.',
      ],
      highlight: { label: 'Order number', value: input.orderNumber },
      details: [
        ...mediaDetails,
        { label: 'Review round', value: String(input.round) },
        {
          label: 'Need help?',
          value: getWhatsAppUrl(
            `Hi, I have feedback on the product design for order ${input.orderNumber}`,
          ),
          linkLabel: 'Chat on WhatsApp',
        },
      ],
      cta: { label: 'Approve design', href: approveUrl },
      secondaryCta: { label: 'Request changes', href: changesUrl },
      footerNote:
        'These review links expire after 30 days. If you did not expect this email, you can ignore it.',
    }),
  });
}
