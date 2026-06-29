import { sendBrandedEmail, sendBrandedEmailToAdmin } from '@/lib/resend/send-email';
import { getEmailSiteUrl, VEDIC_DISCLAIMER } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

export type YagyaBookingEmailInput = {
  id: string;
  bookingNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  yagyaTitle: string;
  amountInr: number | null;
  currency: string;
  razorpayPaymentId: string | null;
  preferredDate: string | null;
  sankalpName: string | null;
  gotra: string | null;
  rashi: string | null;
  nakshatra: string | null;
  message: string | null;
};

function money(amount: number | null, currency: string) {
  if (amount == null) return currency;
  return `${currency} ${amount.toLocaleString('en-IN')}`;
}

export async function sendYagyaBookingEmails(input: YagyaBookingEmailInput): Promise<{ customer: boolean; admin: boolean }> {
  const accountUrl = `${getEmailSiteUrl()}/account/yagyas`;
  const adminUrl = `${getEmailSiteUrl()}/admin/yagya-bookings`;

  const sharedDetails = [
    { label: 'Booking ID', value: input.id },
    { label: 'Booking number', value: input.bookingNumber },
    { label: 'Yagya', value: input.yagyaTitle },
    { label: 'Amount paid', value: money(input.amountInr, input.currency) },
    { label: 'Payment ID', value: input.razorpayPaymentId },
    { label: 'Preferred date', value: input.preferredDate },
    { label: 'Sankalp name', value: input.sankalpName },
    { label: 'Gotra', value: input.gotra },
    { label: 'Rashi', value: input.rashi },
    { label: 'Nakshatra', value: input.nakshatra },
    { label: 'Special instructions', value: input.message },
  ];

  const [adminId, customerId] = await Promise.all([
    sendBrandedEmailToAdmin(
      `Paid yagya booking — ${input.fullName}`,
      TransactionalEmail({
        preview: `${input.fullName} booked ${input.yagyaTitle}`,
        heading: 'New Paid Yagya Booking',
        paragraphs: ['A yagya booking payment has been verified and is ready for priest coordination.'],
        highlight: { label: 'Booking Number', value: input.bookingNumber },
        details: [
          { label: 'Name', value: input.fullName },
          { label: 'Email', value: input.email },
          { label: 'Phone', value: input.phone },
          ...sharedDetails.slice(2),
        ],
        cta: { label: 'Open yagya bookings', href: adminUrl },
      }),
      'consultations'
    ),
    sendBrandedEmail({
      to: input.email,
      subject: 'Yagya booking confirmed | PureVedicGems',
      channel: 'consultations',
      react: TransactionalEmail({
        preview: `Your yagya booking ${input.bookingNumber} is confirmed`,
        heading: 'Yagya Booking Confirmed',
        greeting: `Namaste ${input.fullName},`,
        paragraphs: [
          'Thank you for booking a sacred yagya with Pure Vedic Gems. Your payment has been verified and our pandits will coordinate the next steps with you.',
          'You can view your booking status and updates anytime from your account dashboard.',
        ],
        highlight: { label: 'Booking Number', value: input.bookingNumber },
        details: sharedDetails,
        cta: { label: 'View my yagya bookings', href: accountUrl },
        disclaimer: VEDIC_DISCLAIMER,
        footerNote: 'This is a transactional confirmation for your yagya booking.',
      }),
    }),
  ]);

  return { customer: Boolean(customerId), admin: Boolean(adminId) };
}
