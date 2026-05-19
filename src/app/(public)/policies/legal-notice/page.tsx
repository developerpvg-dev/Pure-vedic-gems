import type { Metadata } from 'next';
import { PolicyArticlePage } from '@/components/policies/PolicyArticlePage';

export const metadata: Metadata = {
  title: 'Anti-Fraud & No-Franchise Legal Notice',
  description: 'Official PureVedicGems anti-fraud, no-franchise, trademark, branch, and contact notice.',
};

export default function LegalNoticePage() {
  return (
    <PolicyArticlePage
      eyebrow="Trust & Legal"
      title="Anti-Fraud & No-Franchise Legal Notice"
      description="Official notice for customers verifying Pure Vedic Gems branches, representatives, trademark use, payments, and communications."
      updated="16 May 2026"
      sections={[
        {
          title: 'Official Business Identity',
          content: 'Pure Vedic Gems Pvt. Ltd. is the official business operating this website. Pure Vedic Gems is a registered trademark and brand identity associated with the Vikas Mehra family tradition of Vedic gemstones, Rudraksha, and spiritual services since 1937.',
        },
        {
          title: 'No Franchise or Unlisted Branches',
          content: 'We have not granted any franchise, reseller authority, or independent branch permission to third parties unless they are explicitly listed on our official website or confirmed by our team in writing.',
          items: [
            'Do not trust sellers using confusingly similar names, logos, social accounts, or phone numbers.',
            'Verify branch addresses and phone numbers through the Contact or Stores page before visiting or paying.',
            'Payments should be made only through official checkout, Razorpay links, bank details confirmed by the official team, or in-store billing counters.',
          ],
        },
        {
          title: 'Fraud Prevention',
          content: 'If anyone claims to sell on behalf of Pure Vedic Gems outside our verified channels, requests payment to a personal account, or promises guaranteed astrological outcomes, contact us before proceeding.',
        },
        {
          title: 'Intellectual Property',
          content: 'All gemstone photographs, videos, articles, designs, product data, certificates, brand marks, and content on this website are protected. Copying, scraping, impersonation, or commercial reuse without written permission may result in legal action.',
        },
      ]}
    />
  );
}