import { getEmailAssetBaseUrl } from '@/lib/resend/email-config';
import { sendBrandedEmail } from '@/lib/resend/send-email';
import {
  OrderConfirmationEmail,
  type OrderConfirmationEmailProps,
} from '@/lib/resend/templates/OrderConfirmation';

async function ringSizeGuideAttachment() {
  try {
    // Fetched over HTTP: Workers has no filesystem access to public/.
    const res = await fetch(`${getEmailAssetBaseUrl()}/ringsizeguide.png`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const content = Buffer.from(await res.arrayBuffer());
    return {
      filename: 'ring-size-measurement-guide.png',
      content,
      contentType: 'image/png',
    };
  } catch (error) {
    console.warn('[Resend] Could not attach ring size guide image:', error);
    return null;
  }
}

export async function sendOrderConfirmationEmail(
  to: string,
  props: OrderConfirmationEmailProps
): Promise<string | null> {
  const attachment = props.ringSizeConfirmUrl ? await ringSizeGuideAttachment() : null;

  return sendBrandedEmail({
    to,
    subject: `Order Confirmed — ${props.orderNumber} | PureVedicGems`,
    react: OrderConfirmationEmail(props),
    channel: 'orders',
    attachments: attachment ? [attachment] : undefined,
  });
}
