import { sendBrandedEmail } from '@/lib/resend/send-email';
import { getEmailSiteUrl, VEDIC_DISCLAIMER } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

export async function sendWelcomeEmail(input: {
  email: string;
  fullName: string;
  requiresEmailVerification?: boolean;
}): Promise<string | null> {
  const siteUrl = getEmailSiteUrl();
  const greeting = input.fullName ? `Namaste ${input.fullName},` : 'Namaste,';

  return sendBrandedEmail({
    to: input.email,
    subject: 'Welcome to Pure Vedic Gems',
    channel: 'general',
    react: TransactionalEmail({
      preview: 'Welcome to Pure Vedic Gems — heritage gemstones since 1937',
      heading: 'Welcome to Pure Vedic Gems',
      greeting,
      paragraphs: [
        'Thank you for creating your account with Pure Vedic Gems. For over four generations, we have guided seekers worldwide with authentic, lab-certified Jyotish gemstones and sacred Rudrakshas.',
        input.requiresEmailVerification
          ? 'Please verify your email address using the separate verification message we have sent. Once verified, you can track orders, consultations, and yagya bookings from your account dashboard.'
          : 'Your account is ready. You can now track orders, consultations, and yagya bookings from your account dashboard.',
        'Our Vedic experts are here to help you choose the right gemstone with care, certification, and traditional guidance.',
      ],
      cta: { label: 'Visit your account', href: `${siteUrl}/account` },
      secondaryCta: { label: 'Explore gemstones', href: `${siteUrl}/shop` },
      disclaimer: VEDIC_DISCLAIMER,
      footerNote: 'You received this email because you registered on PureVedicGems.',
    }),
  });
}
