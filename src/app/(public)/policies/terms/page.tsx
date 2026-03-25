import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Read the terms and conditions governing your use of the PureVedicGems website, purchases, intellectual property, and user conduct.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing and using PureVedicGems.com ("the Website"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use this website.`,
  },
  {
    title: '2. Use of the Website',
    content: `The content on this website — including text, images, graphics, and product descriptions — is for informational and commerce purposes only. You may not use the website for any unlawful purpose. PureVedicGems reserves the right to refuse service, terminate accounts, or cancel orders at its sole discretion.`,
  },
  {
    title: '3. Hyperlinks & Third-Party Content',
    content: `Our website may contain hyperlinks to websites operated by third parties. We do not control and are not responsible for the content or availability of any linked third-party websites. The inclusion of any link does not imply endorsement by PureVedicGems.`,
  },
  {
    title: '4. Intellectual Property & Copyright',
    content: `All content on this website is the exclusive property of Pure Vedic Gems Pvt Ltd. This includes — but is not limited to — all articles, gemstone photographs, videos, editorial write-ups, proprietary gemstone data, brand logos, graphic elements, and website design. You may not reproduce, distribute, modify, or republish any content from this site without express written permission.`,
  },
  {
    title: '5. Reliability of Information',
    content: `While we strive to keep the information accurate and up-to-date, PureVedicGems makes no warranties or representations as to the accuracy, reliability, or completeness of information on this website. Gemstone weights, dimensions, and colors may vary slightly from what is shown online due to lighting, display calibration, and natural variations in gemstones.`,
  },
  {
    title: '6. Data Protection',
    content: `We are committed to protecting your personal data. All customer data — including birth details shared for astrological purposes — is stored securely and never shared with third parties except as required by law. For full details, please refer to our Privacy Policy.`,
  },
  {
    title: '7. Product & Software Quality',
    content: `We source only natural, certified gemstones and use industry-standard jewellery craftsmanship. However, we do not guarantee that any gemstone will produce specific astrological, health, or spiritual results. All gemstones are sold "as described" with accompanying certification from recognised labs.`,
  },
  {
    title: '8. User Conduct',
    content: `When using this website, placing orders, or communicating with our team, you agree not to:\n\n• Submit false or misleading personal/payment information\n• Attempt to gain unauthorised access to our systems\n• Use bots, scrapers, or automated tools to access data from this website\n• Harass, abuse, or threaten PureVedicGems staff\n• Post or transmit harmful content (viruses, spam, malware)`,
  },
  {
    title: '9. Limitation of Liability',
    content: `PureVedicGems, its directors, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the website or its products. This includes, without limitation, damages for loss of profits, data, or other intangible losses.`,
  },
  {
    title: '10. Effectiveness Disclaimer',
    content: `PureVedicGems does not guarantee specific outcomes from wearing gemstones. Vedic gemstone therapy is based on ancient traditions and astrological belief systems. Results vary for each individual, and gemstones should not be used as a substitute for medical, legal, or financial advice.`,
  },
  {
    title: '11. Modifications to Terms',
    content: `PureVedicGems reserves the right to modify these Terms and Conditions at any time without prior notice. Continued use of the website after changes constitutes your acceptance of the revised terms. We encourage you to review this page periodically.`,
  },
  {
    title: '12. Governing Law & Jurisdiction',
    content: `These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these terms shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.`,
  },
];

export default function TermsConditionsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-secondary/30 py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <ScrollReveal>
            <span className="font-body text-xs font-semibold uppercase tracking-[5px] text-accent">
              Policies
            </span>
            <h1 className="mt-3 font-heading text-3xl font-bold text-primary md:text-4xl lg:text-5xl">
              Terms &amp; Conditions
            </h1>
            <OrnamentalDivider className="mx-auto mt-3 max-w-sm" />
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
              Please read these terms carefully before using PureVedicGems.com.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-8">
            {SECTIONS.map((section, i) => (
              <ScrollReveal key={i}>
                <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
                  <h2 className="font-heading text-lg font-semibold text-primary">
                    {section.title}
                  </h2>
                  <div className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* Contact */}
            <ScrollReveal>
              <div className="rounded-sm border-l-4 border-accent bg-accent/5 p-6">
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Questions?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  If you have any questions about these Terms &amp; Conditions, please contact us at{' '}
                  <a href="mailto:purevedicgems@gmail.com" className="font-medium text-accent hover:underline">
                    purevedicgems@gmail.com
                  </a>{' '}
                  or call{' '}
                  <a href="tel:+919871582404" className="font-medium text-accent hover:underline">
                    +91 98715 82404
                  </a>.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
