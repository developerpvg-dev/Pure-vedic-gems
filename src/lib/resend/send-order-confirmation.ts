import { sendBrandedEmail } from '@/lib/resend/send-email';
import {
  OrderConfirmationEmail,
  type OrderConfirmationEmailProps,
} from '@/lib/resend/templates/OrderConfirmation';

export async function sendOrderConfirmationEmail(
  to: string,
  props: OrderConfirmationEmailProps
): Promise<string | null> {
  return sendBrandedEmail({
    to,
    subject: `Order Confirmed — ${props.orderNumber} | PureVedicGems`,
    react: OrderConfirmationEmail(props),
    channel: 'orders',
  });
}
