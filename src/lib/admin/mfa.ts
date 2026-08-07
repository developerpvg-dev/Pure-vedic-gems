/**
 * Admin email-OTP step: password/OAuth proves something you know/have;
 * Supabase email OTP proves inbox control before /admin|/studio.
 *
 * Pending cookie = passed first factor, awaiting OTP (no session).
 * MFA cookie = OTP verified for this user id (checked by proxy + APIs).
 */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

export const ADMIN_MFA_COOKIE = 'pvg_admin_mfa';
export const ADMIN_MFA_PENDING_COOKIE = 'pvg_admin_mfa_pending';

const PENDING_MAX_AGE_SEC = 10 * 60;
const MFA_MAX_AGE_SEC = 12 * 60 * 60;

export type AdminMfaPending = {
  userId: string;
  email: string;
  exp: number;
  next?: string;
};

function getSigningSecret(): string {
  const secret =
    process.env.ADMIN_MFA_SECRET ||
    process.env.BOOKING_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('No signing secret available for admin MFA');
  return secret;
}

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function encodeSigned(parts: string[]): string {
  const payload = parts.join('|');
  return `${payload}|${signPayload(payload)}`;
}

function decodeSigned(raw: string, expectedParts: number): string[] | null {
  const bits = raw.split('|');
  if (bits.length !== expectedParts + 1) return null;
  const signature = bits[bits.length - 1]!;
  const payload = bits.slice(0, -1).join('|');
  if (!timingSafeEqualHex(signature, signPayload(payload))) return null;
  return bits.slice(0, -1);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function safeAdminNext(next: string | null | undefined): string | undefined {
  if (!next?.startsWith('/') || next.startsWith('//')) return undefined;
  if (next.startsWith('/admin') || next.startsWith('/studio')) return next;
  return '/admin';
}

export function setAdminMfaCookie(response: NextResponse, userId: string): void {
  const exp = Math.floor(Date.now() / 1000) + MFA_MAX_AGE_SEC;
  response.cookies.set({
    name: ADMIN_MFA_COOKIE,
    value: encodeSigned([userId, String(exp)]),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MFA_MAX_AGE_SEC,
  });
}

export function clearAdminMfaCookies(response: NextResponse): void {
  response.cookies.set({ name: ADMIN_MFA_COOKIE, value: '', path: '/', maxAge: 0 });
  response.cookies.set({ name: ADMIN_MFA_PENDING_COOKIE, value: '', path: '/', maxAge: 0 });
}

export function setAdminMfaPendingCookie(response: NextResponse, pending: Omit<AdminMfaPending, 'exp'>): void {
  const exp = Math.floor(Date.now() / 1000) + PENDING_MAX_AGE_SEC;
  const next = pending.next ?? '';
  response.cookies.set({
    name: ADMIN_MFA_PENDING_COOKIE,
    value: encodeSigned([pending.userId, pending.email.toLowerCase(), String(exp), next]),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PENDING_MAX_AGE_SEC,
  });
}

export function readAdminMfaPendingFromRequest(request: NextRequest): AdminMfaPending | null {
  return parsePending(request.cookies.get(ADMIN_MFA_PENDING_COOKIE)?.value);
}

export async function readAdminMfaPendingFromCookies(): Promise<AdminMfaPending | null> {
  const jar = await cookies();
  return parsePending(jar.get(ADMIN_MFA_PENDING_COOKIE)?.value);
}

function parsePending(raw: string | undefined): AdminMfaPending | null {
  if (!raw) return null;
  const parts = decodeSigned(raw, 4);
  if (!parts) return null;
  const [userId, email, expStr, next = ''] = parts;
  const exp = Number(expStr);
  if (!userId || !email || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  return { userId, email, exp, next: next || undefined };
}

export function hasValidAdminMfaCookie(request: NextRequest, userId: string): boolean {
  return parseMfa(request.cookies.get(ADMIN_MFA_COOKIE)?.value, userId);
}

export async function hasValidAdminMfaForUser(userId: string): Promise<boolean> {
  const jar = await cookies();
  return parseMfa(jar.get(ADMIN_MFA_COOKIE)?.value, userId);
}

function parseMfa(raw: string | undefined, userId: string): boolean {
  if (!raw) return false;
  const parts = decodeSigned(raw, 2);
  if (!parts) return false;
  const [cookieUserId, expStr] = parts;
  const exp = Number(expStr);
  if (cookieUserId !== userId || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false;
  }
  return true;
}
