import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export const metadata: Metadata = {
  title: 'Returns, Refund & Replacement Policy',
  description:
    'PureVedicGems offers a transparent 15-day return, refund & replacement policy on gemstones and jewelry. Learn about our return conditions and refund process.',
};

export default function ReturnsPolicyPage() {
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
              Returns, Refund & Replacement Policy
            </h1>
            <OrnamentalDivider className="mx-auto mt-3 max-w-sm" />
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
              PureVedicGems offers a very transparent and simple 15-day Return, Refund & Replacement policy.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-10">
            {/* Eligibility conditions */}
            <ScrollReveal>
              <div className="rounded-sm border border-accent/20 bg-accent/5 p-6">
                <h2 className="font-heading text-xl font-semibold text-primary">
                  Conditions to be Eligible
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>Item(s) must be in their original, unused condition.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>Replacement for items are subject to inspection and checking by the PureVedicGems team.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>Damages due to neglect or improper usage will not be covered under this policy.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>Product should be accompanied with Original Product Certificate, Original/Copy of Invoice, packaging, documentation, lab certificates, discount coupons, etc.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Loose Gemstones */}
            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">
                  Return Policy on Loose Gemstones
                </h2>
                <div className="mt-4 overflow-hidden rounded-sm border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="px-4 py-3 text-left font-semibold text-primary">Invoice Value</th>
                        <th className="px-4 py-3 text-left font-semibold text-primary">Return Policy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                      <tr>
                        <td className="px-4 py-3">Up to ₹1,00,000</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-green-600">100% Money Back</span> within 15 days
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Above ₹1,00,000</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-accent">Replacement or 100% Store Credit</span> within 15 days
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollReveal>

            {/* Jewellery */}
            <ScrollReveal>
              <div className="rounded-sm border-l-4 border-accent bg-card p-6 shadow-sm">
                <h2 className="font-heading text-xl font-semibold text-primary">
                  Return Policy on Gemstone Jewellery & Customised Pieces
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Any custom jewellery created for you (rings, pendants, bracelets, etc.) <strong className="text-primary">cannot be returned</strong>. However, if the gemstone does not suit you, you can return the gemstone jewellery items for <strong className="text-accent">store credit worth 70% of your invoice value</strong> (deducting the to-and-fro shipping charges) for use against future purchases from our website/store. Valid up to six months from sale date only.
                </p>
              </div>
            </ScrollReveal>

            {/* Cancellation & Refund */}
            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">
                  Order Cancellation & Refund Policy
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    If you want your placed order to be cancelled and payment refunded, kindly email us at{' '}
                    <a href="mailto:purevedicgems@gmail.com" className="font-medium text-accent hover:underline">
                      purevedicgems@gmail.com
                    </a>{' '}
                    within <strong className="text-primary">24 hours</strong> of ordering. Otherwise, cancellation will be accepted depending on the order process status.
                  </p>
                  <p>
                    Refunds will be initiated by the same payment mode and to the same source from which payment was made. It may take up to <strong className="text-primary">15 to 20 days</strong> for the payment to reflect back in your account.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Important Notes */}
            <ScrollReveal>
              <div className="rounded-sm border border-destructive/20 bg-destructive/5 p-6">
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Important Notes
                </h2>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-destructive">•</span>
                    <span>Shipping charges and payment gateway commission charges are not refundable.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-destructive">•</span>
                    <span>Return shipment is at the customer&apos;s cost.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-destructive">•</span>
                    <span>Any additional lab certificate ordered apart from the free one shall not be refunded.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-destructive">•</span>
                    <span>Returns take 7–8 business days to process. Credit card companies/banks may take another week to reflect.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* FAQ */}
            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">
                  Frequently Asked Questions
                </h2>
                <div className="mt-6 space-y-5">
                  {[
                    {
                      q: 'When does the 15-Day Return Period start?',
                      a: 'The 15-day period starts from the day you receive your product, as shown by our courier records.',
                    },
                    {
                      q: 'I bought 2 loose gemstones and like only one — can I return the other?',
                      a: 'Yes, under our no-questions-asked return policy on gemstones with 100% money back, you can return the other gemstone within the 15-day period.',
                    },
                    {
                      q: 'I have lost the lab certificate and original packaging. Can I still return the loose gemstone?',
                      a: 'We usually require full original product certificate, invoices, documentation, lab certificates, packaging, discount coupons, etc. In their absence, you are not eligible for the 100% Money Back Guarantee. However, you may still be eligible for a full or partial Replacement / Store Credit. Please contact our customer support.',
                    },
                    {
                      q: 'Can I return a gemstone that I purchased and got studded in a ring?',
                      a: 'Custom jewellery cannot be returned. However, you are eligible for a store credit worth 70% of your invoice value for future purchases on PureVedicGems.',
                    },
                    {
                      q: 'How should I sent the gemstone back?',
                      a: 'Contact Customer Support for a Return Authorisation. Ensure you keep all original items. Pack carefully and send only through a reputed courier with insurance. Share the tracking information with us.',
                    },
                  ].map((faq, i) => (
                    <div key={i} className="rounded-sm border border-border bg-card p-5 shadow-sm">
                      <h3 className="font-heading text-sm font-semibold text-primary">
                        {i + 1}. {faq.q}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Important warning */}
            <ScrollReveal>
              <div className="rounded-sm border-l-4 border-destructive bg-destructive/5 p-5">
                <p className="text-sm font-semibold text-primary">⚠️ IMPORTANT</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Do not write the name &quot;Pure Vedic Gems&quot; or any gemstone/jewellery-related words on the return package, as it may attract undue attention and theft. This policy is subject to change without prior notice at the sole discretion of Pure Vedic Gems.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
