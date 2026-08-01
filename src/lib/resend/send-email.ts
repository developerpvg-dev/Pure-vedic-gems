/**
 * Unified branded email sender via Resend.
 */

import type { ReactElement } from 'react';
import { getResendClient } from '@/lib/resend/client';
import { getFromAddress, hasResendConfigured, type EmailChannel } from '@/lib/resend/email-config';

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type SendBrandedEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  channel?: EmailChannel;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

export async function sendBrandedEmail({
  to,
  subject,
  react,
  channel = 'general',
  replyTo,
  attachments,
}: SendBrandedEmailInput): Promise<string | null> {
  if (!hasResendConfigured()) {
    console.warn('[Resend] Skipping email — RESEND_API_KEY is not configured:', subject);
    return null;
  }

  try {
    const resend = getResendClient();
    const recipients = Array.isArray(to) ? to : [to];
    const { data, error } = await resend.emails.send({
      from: getFromAddress(channel),
      to: recipients,
      subject,
      react,
      ...(replyTo ? { replyTo } : {}),
      ...(attachments?.length
        ? {
            attachments: attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType,
            })),
          }
        : {}),
    });

    if (error) {
      console.error('[Resend] Failed to send email:', subject, error);
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    console.error('[Resend] Unexpected email error:', subject, error);
    return null;
  }
}

export async function sendBrandedEmailToAdmin(
  subject: string,
  react: ReactElement,
  channel: EmailChannel = 'general'
): Promise<string | null> {
  const { getAdminNotificationEmail } = await import('@/lib/resend/email-config');
  const adminEmail = getAdminNotificationEmail();
  if (!adminEmail) {
    console.warn('[Resend] Skipping admin email — ADMIN_NOTIFICATION_EMAIL / SALES_NOTIFICATION_EMAIL not set:', subject);
    return null;
  }

  return sendBrandedEmail({ to: adminEmail, subject, react, channel });
}
