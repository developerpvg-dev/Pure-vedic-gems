/**
 * Stateless signed booking tokens for guest payment flows.
 *
 * Guest consultation / yagya bookings are created with `customer_id = null`,
 * so the payment-verify endpoint cannot bind them to an authenticated user.
 * Without an extra proof, anyone who learns (or guesses) a booking UUID could
 * attempt to finalize that booking. To close this, `create-order` issues an
 * HMAC-signed, httpOnly cookie tied to the booking id; `verify` requires that
 * cookie for guest bookings.
 *
 * The token is fully stateless (no DB column required): we sign the booking id
 * with a server-only secret and re-derive it on verification.
 */

import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export type BookingScope = 'consultation' | 'yagya';

const COOKIE_NAMES: Record<BookingScope, string> = {
  consultation: 'pvg_consultation_token',
  yagya: 'pvg_yagya_token',
};

// Payment window — the cookie only needs to survive the checkout session.
const TOKEN_MAX_AGE_SECONDS = 2 * 60 * 60;

function getSigningSecret(): string {
  // Reuse an always-present server-only secret so no new env var is required.
  const secret =
    process.env.BOOKING_TOKEN_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('No signing secret available for booking tokens');
  }
  return secret;
}

function sign(scope: BookingScope, bookingId: string): string {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(`${scope}:${bookingId}`)
    .digest('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function cookieNameForScope(scope: BookingScope): string {
  return COOKIE_NAMES[scope];
}

/**
 * Attach a signed booking-access cookie to the create-order response.
 */
export function setBookingTokenCookie(
  response: NextResponse,
  scope: BookingScope,
  bookingId: string
): void {
  response.cookies.set({
    name: COOKIE_NAMES[scope],
    value: `${bookingId}.${sign(scope, bookingId)}`,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

/**
 * Verify the signed booking cookie matches the booking being finalized.
 * Returns true only if the cookie is present, references this booking id,
 * and carries a valid signature.
 */
export function hasValidBookingToken(
  request: NextRequest,
  scope: BookingScope,
  bookingId: string
): boolean {
  const raw = request.cookies.get(COOKIE_NAMES[scope])?.value;
  if (!raw) return false;

  const separatorIndex = raw.indexOf('.');
  if (separatorIndex <= 0) return false;

  const cookieBookingId = raw.slice(0, separatorIndex);
  const signature = raw.slice(separatorIndex + 1);
  if (cookieBookingId !== bookingId || !signature) return false;

  return timingSafeEqualHex(signature, sign(scope, bookingId));
}
