import crypto from 'crypto';

const INVITE_TTL_MS = 15 * 60 * 1000;

export function createInviteToken() {
  const raw = crypto.randomBytes(32).toString('base64url');
  const hash = hashInviteToken(raw);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  return { raw, hash, expiresAt };
}

export function hashInviteToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function buildInviteUrl(rawToken: string) {
  const base = process.env.EMAIL_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/admin/join?token=${encodeURIComponent(rawToken)}`;
}
