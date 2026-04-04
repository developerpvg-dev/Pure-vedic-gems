/**
 * Resend email client — server-side only.
 */

import { Resend } from 'resend';

let _instance: Resend | null = null;

export function getResendClient(): Resend {
  if (_instance) return _instance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  _instance = new Resend(apiKey);
  return _instance;
}
