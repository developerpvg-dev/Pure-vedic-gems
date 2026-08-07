import crypto from 'crypto';
import type { createAdminClient } from '@/lib/supabase/admin';

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

/** Paginate Auth admin users until email match (listUsers has no email filter). */
export async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
) {
  const normalized = email.toLowerCase();
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}
