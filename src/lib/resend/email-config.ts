/**
 * Shared Resend / transactional email configuration.
 */

export type EmailChannel = 'orders' | 'consultations' | 'general';

export function hasResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** App/site base URL (storefront, SEO, etc.). */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com').replace(/\/$/, '');
}

/**
 * Base URL for links inside transactional emails (CTAs, tracking).
 * Use EMAIL_SITE_URL during staging (e.g. Vercel preview) without changing NEXT_PUBLIC_SITE_URL.
 */
export function getEmailSiteUrl(): string {
  return (process.env.EMAIL_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://purevedicgems.com').replace(
    /\/$/,
    ''
  );
}

/**
 * Host for <img> assets in emails. Localhost is unreachable from Gmail etc.
 * Prefer EMAIL_ASSET_BASE_URL, else EMAIL_SITE_URL / site URL (never localhost).
 */
export function getEmailAssetBaseUrl(): string {
  if (process.env.EMAIL_ASSET_BASE_URL) {
    return process.env.EMAIL_ASSET_BASE_URL.replace(/\/$/, '');
  }
  const site = getEmailSiteUrl();
  if (/localhost|127\.0\.0\.1/i.test(site)) {
    return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.purevedicgems.com').replace(/\/$/, '');
  }
  return site;
}

/**
 * Logo as a remote HTTPS image — never a CID attachment (Gmail shows those as paperclips).
 * Override with EMAIL_LOGO_URL if you host the mark on a CDN.
 */
export function getEmailLogoUrl(): string {
  if (process.env.EMAIL_LOGO_URL) return process.env.EMAIL_LOGO_URL;
  return `${getEmailAssetBaseUrl()}/api/email/logo`;
}

export function getEmailWordmarkUrl(): string {
  if (process.env.EMAIL_WORDMARK_URL) return process.env.EMAIL_WORDMARK_URL;
  return `${getEmailAssetBaseUrl()}/api/email/logo`;
}

export function getFromAddress(channel: EmailChannel = 'general'): string {
  const configured = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL;
  if (configured) return configured;

  const defaults: Record<EmailChannel, string> = {
    orders: 'PureVedicGems <orders@purevedicgems.com>',
    consultations: 'PureVedicGems <consultations@purevedicgems.com>',
    general: 'PureVedicGems <purevedicgems@gmail.com>',
  };

  return defaults[channel];
}

export function getAdminNotificationEmail(): string | null {
  return process.env.SALES_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || null;
}

export function getSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'purevedicgems@gmail.com';
}

export function getSupportPhone(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91-9871582404';
}

export function getWhatsAppUrl(prefill?: string): string {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919871582404').replace(/\D/g, '');
  const text = prefill ? `?text=${encodeURIComponent(prefill)}` : '';
  return `https://wa.me/${number}${text}`;
}

export const VEDIC_DISCLAIMER =
  'Gemstone and astrological guidance is based on traditional Vedic practice and should not be treated as medical, legal, financial, or emergency advice.';
