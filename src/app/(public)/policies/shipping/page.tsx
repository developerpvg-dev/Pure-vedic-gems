import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import { Money } from '@/components/currency/Money';
import { INTL_SHIPPING_ZONE } from '@/lib/shipping/plans';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import type { ShippingPlan } from '@/lib/types/shipping';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description:
    'PureVedicGems shipping policy — domestic and international shipping rates, delivery timelines, packaging, insurance, and customs clearance details.',
};

export const revalidate = 60;

type PolicyPlan = ShippingPlan & { country_name: string };

function orderValueLabel(plan: Pick<ShippingPlan, 'min_order_amount' | 'max_order_amount'>) {
  const min = plan.min_order_amount != null ? Number(plan.min_order_amount) : null;
  const max = plan.max_order_amount != null ? Number(plan.max_order_amount) : null;
  if (min && max) {
    return (
      <>
        Orders <Money amount={min} /> – <Money amount={max} />
      </>
    );
  }
  if (min) {
    return (
      <>
        Orders from <Money amount={min} />
      </>
    );
  }
  if (max) {
    return (
      <>
        Orders up to <Money amount={max} />
      </>
    );
  }
  return 'All order values';
}

function etaLabel(plan: Pick<ShippingPlan, 'estimated_days_min' | 'estimated_days_max'>) {
  if (plan.estimated_days_min != null && plan.estimated_days_max != null) {
    return `${plan.estimated_days_min}–${plan.estimated_days_max} business days after dispatch`;
  }
  return null;
}

function PlansTable({ plans }: { plans: PolicyPlan[] }) {
  if (plans.length === 0) {
    return (
      <p className="mt-4 rounded-sm border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Shipping plans for this region are being updated. Please contact support for current rates.
      </p>
    );
  }

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
          {plans.map((plan) => {
            const eta = etaLabel(plan);
            return (
              <tr key={plan.id}>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-primary">{plan.label}</p>
                  {plan.description ? <p className="mt-1 text-xs">{plan.description}</p> : null}
                </td>
                <td className="px-4 py-3 align-top">{orderValueLabel(plan)}</td>
                <td className="px-4 py-3 align-top font-semibold text-primary">
                  <Money amount={Number(plan.cost)} />
                </td>
                <td className="px-4 py-3 align-top">{eta ?? 'Shared at checkout'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function loadShippingPolicyData() {
  const supabase = createOptionalPublicClient();
  if (!supabase) return { india: [] as PolicyPlan[], international: [] as PolicyPlan[], countryNames: [] as string[] };

  const [{ data: countriesData }, { data: plansData }] = await Promise.all([
    supabase
      .from('shipping_countries')
      .select('code, name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('shipping_methods')
      .select(
        'id, label, description, cost, min_order_amount, max_order_amount, estimated_days_min, estimated_days_max, country_code, sort_order'
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const countries = (countriesData ?? []) as Array<{ code: string; name: string; sort_order: number }>;
  const countryNameByCode = new Map(countries.map((c) => [c.code, c.name]));

  const plans = ((plansData ?? []) as ShippingPlan[])
    .filter((plan) => plan.country_code)
    .map((plan) => ({
      ...plan,
      country_name:
        countryNameByCode.get(plan.country_code) ??
        (plan.country_code === INTL_SHIPPING_ZONE ? 'International' : plan.country_code),
    }));

  const india = plans.filter((plan) => plan.country_code === 'IN');
  const international = plans.filter((plan) => plan.country_code !== 'IN');
  const countryNames = countries
    .filter((c) => c.code !== INTL_SHIPPING_ZONE && c.code !== 'IN')
    .map((c) => c.name);

  return { india, international, countryNames };
}

export default async function ShippingPolicyPage() {
  const { india, international, countryNames } = await loadShippingPolicyData();

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
              Rates below match the active shipping plans in our checkout. Precious gemstones ship with insurance,
              certification, and secure packaging.
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
                      Shipping charges are calculated at checkout from the active plan that matches your destination
                      and order value. The tables on this page reflect those same admin-managed plans.
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
                      <strong className="text-primary">Vedic Cosmic Report</strong> recommendations are delivered by
                      email where included with your order or consultation.
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
                <PlansTable plans={india} />
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Domestic plans include packaging, insurance, certification handling, and tracking as configured for
                    that plan. Exact charge for your cart is confirmed at checkout.
                  </p>
                  <p>
                    Precious gemstones set in gold rings and pendants may require appraisal and formal courier handling
                    before dispatch. Packages are insured for transit.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary">
                  International Shipping
                </h2>
                <PlansTable plans={international} />
                {countryNames.length > 0 ? (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Countries currently enabled for checkout include:{' '}
                    <strong className="text-primary">{countryNames.join(', ')}</strong>
                    {international.some((p) => p.country_code === INTL_SHIPPING_ZONE)
                      ? ', plus other destinations covered by our international plan.'
                      : '.'}{' '}
                    Availability can change — the shipping step at checkout is authoritative.
                  </p>
                ) : null}
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    International plans typically include packaging, insurance, certification handling, export
                    documentation, and tracking. Customs duties or local taxes in the destination country (if any) are
                    payable by the recipient unless stated otherwise at checkout.
                  </p>
                  <p>
                    Allow extra working days for appraisal, insurance paperwork, and customs clearance on top of the
                    delivery window shown for each plan.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="space-y-4">
                <div className="rounded-sm border-l-4 border-accent bg-accent/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Special Talismans</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Special talismans may take up to about 14 days from order placement when extra design work is
                    required. Semi-precious gemstones set in silver and similar pieces may ship by government courier
                    only.
                  </p>
                </div>

                <div className="rounded-sm border-l-4 border-destructive/60 bg-destructive/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Import Restrictions</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Certain gems (for example Red Coral) are restricted or banned for delivery to some destinations
                    such as the United States and Japan. We may cancel or suggest alternatives when a destination
                    cannot receive an item.
                  </p>
                </div>

                <div className="rounded-sm border-l-4 border-accent bg-accent/5 p-4">
                  <h3 className="text-sm font-semibold text-primary">Certification Note</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gems shown with certificates on our website are certified and ship with those certificates. Gems
                    shown without certificates are certified only on request — certification charges are extra and may
                    add about one week before dispatch.
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
