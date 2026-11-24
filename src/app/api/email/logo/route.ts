import { NextResponse } from 'next/server';
import { getEmailAssetBaseUrl } from '@/lib/resend/email-config';

export const runtime = 'nodejs';

/**
 * Back-compat for old emails that still point at /api/email/logo.
 * Serves a redirect to the static emblem (no fs — Workers-safe).
 */
export async function GET() {
  const dest = `${getEmailAssetBaseUrl()}/email/pvg-emblem.png?v=20261124`;
  return NextResponse.redirect(dest, 308);
}
