/** Server-only opaque ring-size confirmation link tokens. Do not import from client components. */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { getEmailSiteUrl } from '@/lib/resend/email-config';

/** ponytail: 30d sealed links; shorten TTL if forward-leak becomes an issue */
const LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function secretKey() {
  const raw =
    process.env.RING_SIZE_CONFIRM_SECRET ||
    process.env.PRODUCT_VIDEO_REVIEW_SECRET ||
    process.env.DELIVERY_PROOF_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'purevedicgems-dev-ring-size-secret';
  return createHash('sha256').update(raw).digest();
}

/** Opaque email link token — decrypts to orderId + revision round. */
export function sealRingSizeConfirmToken(orderId: string, round = 1, ttlMs = LINK_TTL_MS) {
  const iv = randomBytes(12);
  const exp = Date.now() + ttlMs;
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv);
  const plain = Buffer.from(`${orderId}:${round}:${exp}`, 'utf8');
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function openRingSizeConfirmToken(
  token: string,
): { orderId: string; round: number } | null {
  try {
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 29) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', secretKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    const parts = plain.split(':');
    // New: orderId:round:exp — legacy: orderId:exp
    if (parts.length === 2) {
      const [orderId, expStr] = parts;
      const exp = Number(expStr);
      if (!orderId) return null;
      if (!Number.isFinite(exp) || Date.now() > exp) return null;
      return { orderId, round: 1 };
    }
    if (parts.length >= 3) {
      const [orderId, roundStr, expStr] = parts;
      const round = Number(roundStr);
      const exp = Number(expStr);
      if (!orderId || !Number.isInteger(round) || round < 1) return null;
      if (!Number.isFinite(exp) || Date.now() > exp) return null;
      return { orderId, round };
    }
    return null;
  } catch {
    return null;
  }
}

export function ringSizeConfirmPublicLink(
  orderId: string,
  round = 1,
  siteUrl = getEmailSiteUrl(),
) {
  const base = siteUrl.replace(/\/$/, '');
  return `${base}/confirm-ring-size/${sealRingSizeConfirmToken(orderId, round)}`;
}

if (process.env.NODE_ENV !== 'production') {
  const sealed = sealRingSizeConfirmToken('order-abc', 2);
  const opened = openRingSizeConfirmToken(sealed);
  console.assert(opened?.orderId === 'order-abc' && opened.round === 2);
  console.assert(openRingSizeConfirmToken('not-a-token') === null);
}
