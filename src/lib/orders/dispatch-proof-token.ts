/** Server-only opaque delivery-proof link tokens. Do not import from client components. */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/** ponytail: 30d sealed links; shorten TTL if forward-leak becomes an issue */
const POD_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function podSecretKey() {
  const raw =
    process.env.DELIVERY_PROOF_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'purevedicgems-dev-pod-secret';
  return createHash('sha256').update(raw).digest();
}

/** Opaque email/share link token — decrypts to orderId + image index. */
export function sealDeliveryProofToken(orderId: string, index: number, ttlMs = POD_LINK_TTL_MS) {
  const iv = randomBytes(12);
  const exp = Date.now() + ttlMs;
  const cipher = createCipheriv('aes-256-gcm', podSecretKey(), iv);
  const plain = Buffer.from(`${orderId}:${index}:${exp}`, 'utf8');
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function openDeliveryProofToken(
  token: string,
): { orderId: string; index: number } | null {
  try {
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 29) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', podSecretKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    const [orderId, indexStr, expStr] = plain.split(':');
    const index = Number(indexStr);
    const exp = Number(expStr);
    if (!orderId || !Number.isInteger(index) || index < 0 || index > 7) return null;
    if (!Number.isFinite(exp) || Date.now() > exp) return null;
    return { orderId, index };
  } catch {
    return null;
  }
}

export function deliveryProofPublicLink(orderId: string, index: number, siteUrl: string) {
  const base = siteUrl.replace(/\/$/, '');
  return `${base}/api/p/${sealDeliveryProofToken(orderId, index)}`;
}

if (process.env.NODE_ENV !== 'production') {
  const sealed = sealDeliveryProofToken('order-abc', 0);
  const opened = openDeliveryProofToken(sealed);
  console.assert(opened?.orderId === 'order-abc' && opened.index === 0);
  console.assert(openDeliveryProofToken('not-a-token') === null);
}
