import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import { PrivacyRequestForm } from '@/components/privacy/PrivacyRequestForm';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Rights',
  description:
    'PureVedicGems privacy policy, cookie consent, data rights, birth-detail handling, and spiritual guidance disclaimer.',
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy &amp; Data Rights
            </h1>
            <OrnamentalDivider className="mx-auto mt-3 max-w-sm" />
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
              Your privacy, birth details, consent choices, and order data are handled with clear controls.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-10">
            {/* Vedic Astrology Disclaimer */}
            <ScrollReveal>
              <div className="rounded-sm border-l-4 border-accent bg-accent/5 p-6">
                <h2 className="font-heading text-xl font-semibold text-primary">
                  Vedic Astrology &amp; Gemstone Disclaimer
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Much of the content on this website is based on Vedic astrology, which contains many theories and claims pertaining to the use and benefits of gemstones. These claims have <strong className="text-primary">not been scientifically proven</strong> nor are they endorsed as medical, legal or financial advice. Users should consider the information on this website as a reference only.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  PureVedicGems shall not be liable for any claims, losses, or damages arising directly or indirectly from the use or application of any gemstones, products, or Vedic/spiritual guidance offered through this website or our team.
                </p>
              </div>
            </ScrollReveal>

            {/* Data Protection */}
            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">
                  Data Protection &amp; Privacy
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    We are firmly committed to the privacy of our customers. We do understand the importance of the information you entrust to us, especially your birth date, birth time, and other astrological details.
                  </p>
                  <div className="rounded-sm border border-border bg-card p-5 shadow-sm">
                    <h3 className="font-heading text-sm font-semibold text-primary">What We Collect</h3>
                    <ul className="mt-3 space-y-2">
                      <li className="flex gap-2">
                        <span className="mt-0.5 shrink-0 text-accent">✦</span>
                        <span>Name, email, phone number (for order fulfillment and communication)</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 shrink-0 text-accent">✦</span>
                        <span>Shipping and billing address</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 shrink-0 text-accent">✦</span>
                        <span>Date of birth, time of birth, and place of birth (for Vedic consultation purposes only)</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 shrink-0 text-accent">✦</span>
                        <span>Payment information (processed securely via Razorpay — we do not store card details)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* No Sharing */}
            <ScrollReveal>
              <div className="rounded-sm border border-green-500/20 bg-green-500/5 p-6">
                <h2 className="font-heading text-xl font-semibold text-primary">
                  We Never Share Your Data
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Your personal information, birth details, and purchase history will <strong className="text-primary">never be sold, rented, or shared with any third party</strong> for marketing or any other purpose.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Data is used solely for order processing, personalized gemstone recommendations, astrological consultation, and customer service. Only authorized PureVedicGems team members have access to your data.
                </p>
              </div>
            </ScrollReveal>

            {/* Legal Exceptions */}
            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">
                  Legal Exceptions
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  We may disclose your personal information if required to do so by law, in response to valid requests by government authorities (e.g., a court order, government agency, or law enforcement), or when we believe in good faith that disclosure is necessary to:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-accent">•</span>
                    <span>Comply with a legal obligation</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-accent">•</span>
                    <span>Protect and defend the rights or property of PureVedicGems</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-accent">•</span>
                    <span>Prevent or investigate possible wrongdoing in connection with the service</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-accent">•</span>
                    <span>Protect the personal safety of users or the public</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Cookies & Analytics */}
            <ScrollReveal>
              <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Cookies &amp; Analytics
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Essential cookies support cart, checkout, account security, and fraud prevention. Analytics cookies are loaded only after consent. You can change your choice by clearing the cookie named <strong className="text-primary">pvg_cookie_consent</strong> and revisiting the site.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Your Data Rights
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li>• Request a copy of your account, order, consultation, saved-item, and notification data.</li>
                  <li>• Ask us to correct inaccurate personal, billing, or birth-detail information.</li>
                  <li>• Request deletion where retention is not legally required for invoices, tax, fraud prevention, or disputes.</li>
                  <li>• Withdraw marketing, WhatsApp, or analytics consent without affecting essential order communication.</li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <PrivacyRequestForm />
            </ScrollReveal>

            {/* Contact */}
            <ScrollReveal>
              <div className="rounded-sm border-l-4 border-accent bg-secondary/30 p-6">
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Questions About Your Privacy?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  If you have any concerns about how your data is handled, or wish to have your data deleted, please contact us at{' '}
                  <a href="mailto:purevedicgems@gmail.com" className="font-medium text-accent hover:underline">
                    purevedicgems@gmail.com
                  </a>{' '}
                  or call us at{' '}
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
