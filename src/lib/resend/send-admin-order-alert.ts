import { sendBrandedEmail, sendBrandedEmailToAdmin } from '@/lib/resend/send-email';
import { getEmailSiteUrl } from '@/lib/resend/email-config';
import { TransactionalEmail } from '@/lib/resend/templates/TransactionalEmail';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function sendAdminOrderAlertEmail(input: {
  orderId: string;
  orderNumber: string;
  total: number;
  /** Prefers locked FX label when present. */
  totalLabel?: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  paymentMethod?: string | null;
}): Promise<string | null> {
  const adminUrl = `${getEmailSiteUrl()}/admin/orders/${input.orderId}`;
  const totalDisplay = input.totalLabel ?? formatINR(input.total);

  return sendBrandedEmailToAdmin(
    `New paid order — ${input.orderNumber}`,
    TransactionalEmail({
      preview: `Paid order ${input.orderNumber} from ${input.customerName}`,
      heading: 'New Paid Order',
      greeting: 'A customer order has been paid and is ready for fulfillment.',
      highlight: { label: 'Order Number', value: input.orderNumber },
      details: [
        { label: 'Customer', value: input.customerName },
        { label: 'Email', value: input.customerEmail },
        { label: 'Items', value: String(input.itemCount) },
        { label: 'Order total', value: totalDisplay },
        { label: 'Payment method', value: input.paymentMethod?.replace(/_/g, ' ') ?? 'Razorpay' },
      ],
      cta: { label: 'Open order in admin', href: adminUrl },
    }),
    'orders'
  );
}
