/** Server-only opaque package-address review link tokens. Do not import from client components. */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { getEmailSiteUrl } from '@/lib/resend/email-config';

/** ponytail: 30d sealed links; shorten TTL if forward-leak becomes an issue */
const REVIEW_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function reviewSecretKey() {
  const raw =
    process.env.PRODUCT_VIDEO_REVIEW_SECRET ||
    process.env.DELIVERY_PROOF_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'purevedicgems-dev-par-secret';
  return createHash('sha256').update(raw).digest();
}

/** Opaque email link token — decrypts to orderId + review round. Prefixed so it cannot be reused on /review-design. */
export function sealPackageAddressReviewToken(orderId: string, round: number, ttlMs = REVIEW_LINK_TTL_MS) {
  const iv = randomBytes(12);
  const exp = Date.now() + ttlMs;
  const cipher = createCipheriv('aes-256-gcm', reviewSecretKey(), iv);
  const plain = Buffer.from(`par:${orderId}:${round}:${exp}`, 'utf8');
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function openPackageAddressReviewToken(
  token: string,
): { orderId: string; round: number } | null {
  try {
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 29) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', reviewSecretKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    const [kind, orderId, roundStr, expStr] = plain.split(':');
    if (kind !== 'par') return null;
    const round = Number(roundStr);
    const exp = Number(expStr);
    if (!orderId || !Number.isInteger(round) || round < 1) return null;
    if (!Number.isFinite(exp) || Date.now() > exp) return null;
    return { orderId, round };
  } catch {
    return null;
  }
}

export function packageAddressReviewPublicLink(
  orderId: string,
  round: number,
  decision?: 'approve' | 'changes',
  siteUrl = getEmailSiteUrl(),
) {
  const base = siteUrl.replace(/\/$/, '');
  const token = sealPackageAddressReviewToken(orderId, round);
  const q = decision ? `?d=${decision}` : '';
  return `${base}/review-package/${token}${q}`;
}

if (process.env.NODE_ENV !== 'production') {
  const sealed = sealPackageAddressReviewToken('order-abc', 2);
  const opened = openPackageAddressReviewToken(sealed);
  console.assert(opened?.orderId === 'order-abc' && opened.round === 2);
  console.assert(openPackageAddressReviewToken('not-a-token') === null);
}
