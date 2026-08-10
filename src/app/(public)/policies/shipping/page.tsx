import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import { Money } from '@/components/currency/Money';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description:
    'PureVedicGems shipping policy — domestic and international shipping rates, delivery timelines, packaging, insurance, and customs clearance details.',
};

type RateRow = {
  plan: string;
  description?: string;
  orderValue: ReactNode;
  charge: ReactNode;
  delivery: string;
};

function PlansTable({ rows }: { rows: RateRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto overflow-hidden rounded-sm border border-border">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="bg-secondary">
            <th className="px-4 py-3 text-left font-semibold text-primary">Plan</th>
            <th className="px-4 py-3 text-left font-semibold text-primary">Order value</th>
            <th className="px-4 py-3 text-left font-semibold text-primary">Charge</th>
            <th className="px-4 py-3 text-left font-semibold text-primary">Delivery window</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-muted-foreground">
          {rows.map((row) => (
            <tr key={row.plan}>
              <td className="px-4 py-3 align-top">
                <p className="font-medium text-primary">{row.plan}</p>
                {row.description ? <p className="mt-1 text-xs">{row.description}</p> : null}
              </td>
              <td className="px-4 py-3 align-top">{row.orderValue}</td>
              <td className="px-4 py-3 align-top font-semibold text-primary">{row.charge}</td>
              <td className="px-4 py-3 align-top">{row.delivery}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const indiaRows: RateRow[] = [
  {
    plan: 'Shipping Via India Post Speed Post Service',
    description: 'Domestic Shipping for orders up to ₹25,000',
    orderValue: (
      <>
        Orders <Money amount={500} /> – <Money amount={25000} />
      </>
    ),
    charge: (
      <>
        <Money amount={200} /> to <Money amount={500} />
      </>
    ),
    delivery: '6–7 business days after dispatch',
  },
  {
    plan: 'India shipping (orders above ₹25,000)',
    description: 'Insured domestic shipping for orders above ₹25,000.',
    orderValue: (
      <>
        Orders from <Money amount={25001} />
      </>
    ),
    charge: (
      <>
        <Money amount={800} /> to <Money amount={2000} />
      </>
    ),
    delivery: '2–3 business days after dispatch',
  },
];

const internationalRows: RateRow[] = [
  {
    plan: 'International shipping via EMS India Post (orders up to ₹25,000)',
    description: 'Tracked international shipping for orders up to ₹25,000.',
    orderValue: (
      <>
        Orders up to <Money amount={25000} />
      </>
    ),
    charge: <Money amount={2500} />,
    delivery: '12–15 business days after dispatch',
  },
  {
    plan: 'International shipping via Private Courier Service (orders up to ₹25,000)',
    description: 'Tracked international shipping for orders up to ₹25,000.',
    orderValue: (
      <>
        Orders up to <Money amount={25000} />
      </>
    ),
    charge: <Money amount={5000} />,
    delivery: '6–7 business days after dispatch',
  },
  {
    plan: 'International shipping (orders above ₹25,000)',
    description: 'Tracked international shipping for orders above ₹25,000.',
    orderValue: (
      <>
        Orders from <Money amount={25001} />
      </>
    ),
    charge: (
      <>
        <Money amount={8000} /> to <Money amount={10000} />
      </>
    ),
    delivery: '8–10 business days after dispatch',
  },
];

export default function ShippingPolicyPage() {
  return (
    <>
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
              Domestic and international shipping rates, delivery timelines, and important notes for gemstone and
              talisman orders.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="prose-pvg space-y-10">
            <ScrollReveal>
              <div className="rounded-sm border border-accent/20 bg-accent/5 p-6">
                <h2 className="font-heading text-xl font-semibold text-primary">
                  General Shipping Information
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>
                      Shipping charges are calculated at checkout from the plan that matches your destination and
                      order value. Exact charge for your cart is confirmed before payment.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>
                      Your <strong className="text-primary">Gemstone/Talisman</strong> is typically dispatched within
                      one week of order confirmation once design, certification, and energization steps are complete —
                      along with its lab certificate* and wearing ritual manual where applicable.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>
                      Charges for making your gemstone into silver/gold/panch dhatu jewellery are extra, as shown on
                      the product configurator / designs options.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-accent">✦</span>
                    <span>
                      If your order includes a Vedic Horoscope Analysis, Remedies Recommendation, or Detailed
                      Consultation, confirmation and further instructions regarding the process will be sent to you
                      via email.
                    </span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">
                  Domestic Shipping (Within India)
                </h2>
                <PlansTable rows={indiaRows} />
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">International Shipping</h2>
                <PlansTable rows={internationalRows} />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Customs duties or local taxes in the destination country (if any) are payable by the recipient
                  unless stated otherwise at checkout. Allow extra working days for appraisal, insurance paperwork,
                  and customs clearance on top of the delivery window shown for each plan.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="space-y-4">
                <div className="rounded-sm border-l-4 border-accent bg-accent/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Special Talismans</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    When additional specialized design work is required, special designs may take some extra time to
                    prepare after the order is placed. This may take slightly longer than the time indicated.
                    Semi-precious gemstones set in silver or gold, as well as similar items, will be shipped only
                    through the selected courier service.
                  </p>
                </div>

                <div className="rounded-sm border-l-4 border-destructive/60 bg-destructive/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Import Restrictions</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Certain gems, such as Red Coral, may be restricted or prohibited for delivery to certain
                    destinations, such as the United States and Japan. If an item cannot be shipped to a particular
                    destination, we may cancel the order or suggest an alternative.
                  </p>
                </div>

                <div className="rounded-sm border-l-4 border-accent bg-accent/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Certification Note</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gems shown with certificates on our website are certified and are shipped with the corresponding
                    certificates. Gems shown without certificates can be certified upon request only. Certification
                    charges are additional and may require approximately one extra week before dispatch.
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
