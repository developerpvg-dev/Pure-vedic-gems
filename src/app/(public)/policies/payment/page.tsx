import type { Metadata } from 'next';
import { PolicyArticlePage } from '@/components/policies/PolicyArticlePage';

export const metadata: Metadata = {
  title: 'Payment Methods',
  description:
    'How to pay at PureVedicGems — Razorpay (UPI, cards, net banking), PayGlocal for international checkout, and bank transfer for eligible orders.',
};

export default function PaymentPolicyPage() {
  return (
    <PolicyArticlePage
      eyebrow="Policies"
      title="Payment Methods"
      description="Secure checkout options for India and international orders. Card and UPI details are handled by authorised payment gateways — never stored on our servers."
      updated="March 2026"
      sections={[
        {
          title: 'Razorpay (India)',
          content:
            'Most India orders are paid through Razorpay, an RBI-authorised payment gateway. You can pay with:',
          items: [
            'UPI (Google Pay, PhonePe, Paytm, and other UPI apps)',
            'Credit and debit cards (Visa, Mastercard, RuPay, and other supported networks)',
            'Net banking from major Indian banks',
          ],
        },
        {
          title: 'PayGlocal (international)',
          content:
            'Where enabled at checkout, PayGlocal supports international cards and select wallets (including Apple Pay where available). You are redirected to PayGlocal’s secure page to complete payment.',
        },
        {
          title: 'Bank transfer',
          content:
            'For eligible orders (including advance or balance payments for logged-in customers), you may pay by bank transfer to the PureVedicGems account shown at checkout. Always use the reference / order details provided so we can match your payment quickly.',
        },
        {
          title: 'Security',
          content:
            'PureVedicGems never collects or stores full card numbers or UPI PINs. Payment is completed on the gateway’s page, and order totals are verified on our server before the payment window opens.',
        },
      ]}
    />
  );
}
