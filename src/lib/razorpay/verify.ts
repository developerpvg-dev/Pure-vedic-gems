/**
 * Razorpay HMAC signature verification utilities.
 *
 * Two verification patterns:
 * 1. Payment verification — verifies the signature after checkout completes
 *    Signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 *
 * 2. Webhook verification — verifies webhook POST body authenticity
 *    Signature = HMAC-SHA256(request_body, webhook_secret)
 */

import crypto from 'crypto';

/**
 * Verify Razorpay payment signature after checkout flow completes.
 * This must be called server-side to confirm the payment is authentic.
 *
 * @param orderId - razorpay_order_id returned by Razorpay
 * @param paymentId - razorpay_payment_id returned on successful payment
 * @param signature - razorpay_signature returned by Razorpay checkout
 * @returns true if the signature is valid
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    // Buffers of different length will throw — that means mismatch
    return false;
  }
}

/**
 * Verify Razorpay webhook signature.
 * Webhooks are signed with the webhook secret (different from key_secret).
 *
 * @param body - Raw request body string
 * @param signature - Value of x-razorpay-signature header
 * @returns true if the webhook is authentic
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}
