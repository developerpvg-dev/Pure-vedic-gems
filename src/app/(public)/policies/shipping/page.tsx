import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description:
    'PureVedicGems shipping policy — domestic and international shipping rates, delivery timelines, packaging, insurance, and customs clearance details.',
};

export default function ShippingPolicyPage() {
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
              Shipping Policy
            </h1>
            <OrnamentalDivider className="mx-auto mt-3 max-w-sm" />
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
              All precious gemstones are shipped with insurance, certification, and secure packaging.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="prose-pvg space-y-10">
            {/* General Info */}
            <ScrollReveal>
              <div className="rounded-sm border border-accent/20 bg-accent/5 p-6">
                <h2 className="font-heading text-xl font-semibold text-primary">
                  General Shipping Information
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>
                      <strong className="text-primary">Vedic Cosmic Report</strong> (Vedic horoscope with gems recommendation) — shipped free of charge via email for both domestic and international orders.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>
                      Your <strong className="text-primary">Gemstone/Talisman</strong> will be dispatched within one week of placing the order, made into your choice of design, along with its lab certificate* and wearing ritual manual.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>
                      Charges for making your Gemstone into silver/gold/panch dhatu design are extra, as mentioned on the designs page.
                    </span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Domestic Shipping  */}
            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">
                  🇮🇳 Domestic Shipping (Within India)
                </h2>
                <div className="mt-4 overflow-hidden rounded-sm border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="px-4 py-3 text-left font-semibold text-primary">Item</th>
                        <th className="px-4 py-3 text-left font-semibold text-primary">Charges</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                      <tr>
                        <td className="px-4 py-3">Standard Shipping</td>
                        <td className="px-4 py-3">₹250 or 5% of total order cost (whichever is more)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Includes</td>
                        <td className="px-4 py-3">Packaging, insurance, certification & tracking</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Our system charges default shipping as per the structure above. However, for delivery in India we charge actuals as charges vary per location. Excess amount received, if any, is refunded by cheque along with the product.
                  </p>
                  <p>
                    All precious gemstones set in Gold rings and pendants are sent after appraisal by the Reserve Bank of India, Indian Customs, and the Postal Appraisal Department after affixing wax seals on the package. Your package is insured and carried by the Government of India Post Department Services.
                  </p>
                  <p>
                    <strong className="text-primary">Precious articles are only sent by Government courier after appraisal.</strong>
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Timeline */}
            <ScrollReveal>
              <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
                <h3 className="font-heading text-base font-semibold text-primary">
                  Domestic Delivery Timeline
                </h3>
                <div className="mt-4 space-y-3">
                  {[
                    { step: '3–5 business days', desc: 'Ring, pendant, or talisman crafting' },
                    { step: '2 business days', desc: 'Purification & Vedic energization by our Pundits' },
                    { step: '2 business days', desc: 'Certification and appraisal' },
                    { step: '7–10 business days', desc: 'Delivery after dispatch' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                        {i + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-primary">{item.step}</span>
                        <span className="text-muted-foreground"> — {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* International Shipping */}
            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">
                  🌍 International Shipping (Outside India)
                </h2>
                <div className="mt-4 overflow-hidden rounded-sm border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="px-4 py-3 text-left font-semibold text-primary">Item</th>
                        <th className="px-4 py-3 text-left font-semibold text-primary">Charges</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                      <tr>
                        <td className="px-4 py-3">International Shipping</td>
                        <td className="px-4 py-3">₹2,250 or 15% of total order cost (whichever is more)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Includes</td>
                        <td className="px-4 py-3">Packaging, insurance, certification, appraisal, customs clearance & tracking</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Extra Time</td>
                        <td className="px-4 py-3">4–5 extra working days for appraisal, insurance & customs</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollReveal>

            {/* Special Notes */}
            <ScrollReveal>
              <div className="space-y-4">
                <div className="rounded-sm border-l-4 border-accent bg-accent/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Special Talismans</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Special Talismans will be shipped in 14 days from the date of placement of order as they require extra design work. Semi-precious gemstones set in silver and other semi-precious talismans are shipped by Government Speed Post only.
                  </p>
                </div>

                <div className="rounded-sm border-l-4 border-destructive/60 bg-destructive/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Countries Not Served by Speed Post</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Indian Postal Service does not ship merchandise by Speed Post to: Argentina, Belgium, Cape Verde, Denmark, El Salvador, Guyana, Indonesia, Iran, Iraq, Kuwait, Luxembourg, Maldives, Mexico, Niger, Nigeria, Panama, Papua New Guinea, Rwanda, Saudi Arabia, Sri Lanka, Tunisia, Yemen, Zaire, Sweden, Oman, Peru.
                  </p>
                </div>

                <div className="rounded-sm border-l-4 border-destructive/60 bg-destructive/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Import Restrictions</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Certain gems like Red Corals are banned for delivery to the United States, Japan, etc.
                  </p>
                </div>

                <div className="rounded-sm border-l-4 border-accent bg-accent/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Certification Note</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gems shown with certificates on our website are certified and will be shipped with those certificates. Gems shown without certificates will be certified only on customer request — certification charges are extra and one week&apos;s extra time will be required.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
