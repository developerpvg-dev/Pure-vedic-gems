/** India pays ₹101; all other countries get remedies recommendation free (IP-based). */
export const RS101_PAID_COUNTRY_CODE = 'IN';

const UNKNOWN_GEO_CODES = new Set(['', 'XX', 'T1']);

export function countryCodeFromHeaders(headers: { get(name: string): string | null }): string | null {
  const raw = headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry');
  if (!raw) return null;
  const code = raw.toUpperCase();
  if (UNKNOWN_GEO_CODES.has(code)) return null;
  return code;
}

/** Unknown geo defaults to paid (India-safe, reduces free-booking abuse). */
export function isRs101PaidCountry(countryCode: string | null | undefined): boolean {
  const code = (countryCode ?? '').trim().toUpperCase();
  if (!code || UNKNOWN_GEO_CODES.has(code)) return true;
  return code === RS101_PAID_COUNTRY_CODE;
}

export function isRs101GemRecommendation(consultation: {
  plan_id?: string | null;
  plan_title_snapshot?: string | null;
  amount_inr?: number | null;
}): boolean {
  const title = (consultation.plan_title_snapshot || '').toLowerCase();
  const amount = Number(consultation.amount_inr ?? 0);
  return (
    consultation.plan_id == null &&
    (title.includes('gem recommendation') || amount === 101 || amount === 0)
  );
}
