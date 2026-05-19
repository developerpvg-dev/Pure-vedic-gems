import type { Metadata } from 'next';
import { PolicyArticlePage } from '@/components/policies/PolicyArticlePage';

export const metadata: Metadata = {
  title: 'Certificate & Trust Center',
  description: 'PureVedicGems certificate handling, lab disclosure, trust checks, proof documents, and customer verification guidance.',
};

export default function CertificationTrustPage() {
  return (
    <PolicyArticlePage
      eyebrow="Trust Center"
      title="Certificate & Trust Center"
      description="How certificates, invoices, proof media, and trust checks should work across the PureVedicGems storefront and order flow."
      updated="16 May 2026"
      sections={[
        {
          title: 'Certificate Handling',
          content: 'Products shown with certificates should ship with the listed certificate or an equivalent verified certificate. Products without a certificate can be certified on request where possible, subject to lab fees and additional turnaround time.',
        },
        {
          title: 'Recognised Labs',
          content: 'PureVedicGems may work with Indian Government labs and reputed international gemological labs such as GIA, IGI, GRS, Gubelin, GII, and IIGJ where relevant to the product and customer request.',
        },
        {
          title: 'Customer Verification Checklist',
          content: 'Before purchase, customers should verify SKU/tag number, carat/ratti, origin, treatment notes, certificate number, lab name, price, shipping method, and return eligibility. For high-value orders, contact the team for a manual verification call.',
        },
        {
          title: 'Documents After Purchase',
          content: 'Paid orders should receive order confirmation, invoice where applicable, certificate/proof documents where purchased or included, and tracking information once dispatched. Invoice PDFs are stored privately and should be accessible only to the customer or authorized staff.',
        },
      ]}
    />
  );
}