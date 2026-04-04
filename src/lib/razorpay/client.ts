/**
 * Razorpay server-side SDK client.
 * This module must ONLY be imported in server-side code (API routes, server components).
 * The Razorpay secret key is never exposed to the browser.
 */

import Razorpay from 'razorpay';

let _instance: InstanceType<typeof Razorpay> | null = null;

/**
 * Returns a singleton Razorpay SDK instance.
 * Uses test keys in development and live keys in production.
 */
export function getRazorpayClient(): InstanceType<typeof Razorpay> {
  if (_instance) return _instance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      'Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local'
    );
  }

  _instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return _instance;
}
