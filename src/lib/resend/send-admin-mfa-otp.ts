import { sendBrandedEmail } from '@/lib/resend/send-email';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

/** Staff MFA: 6-digit code only (no magic link). */
export async function sendAdminMfaOtpEmail(params: {
  to: string;
  code: string;
}): Promise<boolean> {
  const messageId = await sendBrandedEmail({
    to: params.to,
    subject: `${params.code} — your Pure Vedic Gems admin code`,
    channel: 'general',
    react: TransactionalEmail({
      preview: `Your admin verification code is ${params.code}`,
      heading: 'Admin verification code',
      greeting: 'Hello,',
      paragraphs: [
        'Someone signed in to a Pure Vedic Gems team account. Enter this code to continue. It expires in a few minutes.',
        'If you did not try to sign in, ignore this email and change your password.',
      ],
      highlight: { label: 'Your code', value: params.code },
      footerNote: 'Do not share this code. Pure Vedic Gems will never ask for it by phone.',
    }),
  });
  return Boolean(messageId);
}
