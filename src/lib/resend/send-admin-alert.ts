import { sendBrandedEmailToAdmin } from '@/lib/resend/send-email';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

export async function sendAdminOperationalAlertEmail(input: {
  subject: string;
  heading: string;
  preview: string;
  paragraphs?: string[];
  details?: { label: string; value: string | number | null | undefined }[];
  cta?: { label: string; href: string };
}): Promise<string | null> {
  return sendBrandedEmailToAdmin(
    input.subject,
    TransactionalEmail({
      preview: input.preview,
      heading: input.heading,
      paragraphs: input.paragraphs,
      details: input.details,
      cta: input.cta,
      detailsTitle: 'Alert details',
    }),
    'general'
  );
}
