import type { Metadata } from 'next';
import { PolicyArticlePage } from '@/components/policies/PolicyArticlePage';

export const metadata: Metadata = {
  title: 'Gemstone Treatment & Disclosure Policy',
  description: 'How PureVedicGems discloses natural, heated, treated, enhanced, certified, and uncertified gemstone information.',
};

export default function TreatmentDisclosurePage() {
  return (
    <PolicyArticlePage
      eyebrow="Gemstone Disclosure"
      title="Treatment & Enhancement Disclosure"
      description="A transparent disclosure framework for natural gemstones, treatment status, certificates, and product-page claims."
      updated="16 May 2026"
      sections={[
        {
          title: 'Our Disclosure Standard',
          content: 'Every product page should disclose the available treatment information, certification status, origin information where known, and any limits of certainty. Natural variation in colour, inclusions, and appearance is normal in gemstones.',
        },
        {
          title: 'Treatment Categories',
          content: 'Gemstones may be described as natural, untreated, heated, oil-treated, clarity-enhanced, dyed, filled, composite, synthetic, lab-created, or treatment-not-determined depending on available evidence and lab findings.',
          items: [
            'Untreated claims must be supported by supplier documentation, lab certificate, expert inspection, or legacy provenance.',
            'If treatment cannot be confirmed, the product should avoid stronger claims than the evidence supports.',
            'Customer-requested additional lab certification may add cost and turnaround time.',
          ],
        },
        {
          title: 'Astrological Use',
          content: 'Astrological suitability is based on Vedic tradition and expert guidance. We do not guarantee a specific result from any gemstone, and gemstone use is not a substitute for medical, legal, financial, or mental-health advice.',
        },
        {
          title: 'Certificate Conflicts',
          content: 'If a later lab report materially differs from product-page information, the order should be reviewed by the support team. Resolution may include clarification, replacement, store credit, refund review, or escalation according to the Returns Policy.',
        },
      ]}
    />
  );
}