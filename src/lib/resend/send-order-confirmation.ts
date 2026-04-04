/**
 * Send order confirmation email via Resend.
 * Called after successful payment verification.
 */

import { getResendClient } from '@/lib/resend/client';
import {
  OrderConfirmationEmail,
  type OrderConfirmationEmailProps,
} from '@/lib/resend/templates/OrderConfirmation';

const FROM_EMAIL = 'PureVedicGems <orders@purevedicgems.com>';

/**
 * Send order confirmation email to the customer.
 * Returns the Resend message ID on success, or null on failure.
 * Errors are logged but don't throw — email failure should not block the order flow.
 */
export async function sendOrderConfirmationEmail(
  to: string,
  props: OrderConfirmationEmailProps
): Promise<string | null> {
  try {
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Order Confirmed — ${props.orderNumber} | PureVedicGems`,
      react: OrderConfirmationEmail(props),
    });

    if (error) {
      console.error('[Resend] Failed to send order confirmation:', error);
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    console.error('[Resend] Unexpected error sending order confirmation:', err);
    return null;
  }
}
