import Link from 'next/link';
import { ChevronDown, CreditCard, RotateCcw, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type PolicyColumn = {
  title: string;
  href: string;
  Icon: LucideIcon;
  intro?: string;
  points: string[];
};

const COLUMNS: PolicyColumn[] = [
  {
    title: 'Shipping Policy',
    href: '/policies/shipping',
    Icon: Truck,
    intro: 'India and worldwide shipping available.',
    points: [
      'Shipping charges are confirmed at checkout based on destination and order value.',
      'Domestic delivery typically 2–7 business days after dispatch, depending on the plan.',
      'International EMS/courier plans available; customs duties (if any) are paid by the recipient.',
    ],
  },
  {
    title: 'Return Policy',
    href: '/policies/returns',
    Icon: RotateCcw,
    points: [
      'Loose gemstones up to ₹1,00,000: 100% money back within 15 days.',
      'Above ₹1,00,000: replacement or 100% store credit within 15 days.',
      'Custom jewellery is non-returnable; gemstone jewellery may qualify for 70% store credit.',
    ],
  },
  {
    title: 'Payment Method',
    href: '/policies/payment',
    Icon: CreditCard,
    points: [
      'Pay securely via Razorpay — UPI, cards, and net banking in India.',
      'International cards and wallets via PayGlocal where enabled.',
      'Bank transfer available for advance / balance payments on eligible orders.',
    ],
  },
];

function PolicyBody({ intro, points, href }: Pick<PolicyColumn, 'intro' | 'points' | 'href'>) {
  return (
    <div className="text-[13px] leading-relaxed text-[#3D2B1F]">
      {intro ? <p className="mb-2 font-medium">{intro}</p> : null}
      <ol className="list-decimal space-y-1.5 pl-4">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ol>
      <Link
        href={href}
        className="mt-3 inline-block text-[13px] font-semibold text-[#7A1515] underline-offset-2 hover:underline"
      >
        know more
      </Link>
    </div>
  );
}

/** Pre-purchase policies — accordion on phone, 3 columns on desktop. */
export function ProductPurchasePolicies() {
  return (
    <section className="mt-10 lg:mt-14" aria-labelledby="purchase-policies-heading">
      <h2
        id="purchase-policies-heading"
        className="mb-4 text-center text-xl font-medium text-[#7A1515] lg:mb-5 lg:text-2xl"
      >
        Things you want to know before purchase
      </h2>

      {/* Phone: accordion rows */}
      <div className="space-y-2 md:hidden">
        {COLUMNS.map(({ title, href, Icon, intro, points }) => (
          <details
            key={href}
            className="group overflow-hidden rounded-md border border-[#E5E0D8] bg-white open:shadow-[0_2px_10px_rgba(61,43,31,0.06)]"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
              <Icon className="h-4 w-4 shrink-0 text-[#3D2B1F]" strokeWidth={1.75} aria-hidden />
              <span className="min-w-0 flex-1 text-sm font-semibold text-[#1D1715]">{title}</span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-[#7A6250] transition duration-200 group-open:rotate-180"
                strokeWidth={1.75}
                aria-hidden
              />
            </summary>
            <div className="border-t border-[#E5E0D8] px-3.5 py-3">
              <PolicyBody intro={intro} points={points} href={href} />
            </div>
          </details>
        ))}
      </div>

      {/* Desktop: 3-column panel */}
      <div className="hidden overflow-hidden rounded-lg border border-[#E5E0D8] md:block">
        <div className="grid divide-y divide-[#E5E0D8] md:grid-cols-3 md:divide-x md:divide-y-0">
          {COLUMNS.map(({ title, href, Icon, intro, points }) => (
            <article key={href} className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2 border-b border-[#E5E0D8] bg-[#F7F5F1] px-4 py-3 sm:px-5">
                <Icon className="h-4 w-4 shrink-0 text-[#3D2B1F]" strokeWidth={1.75} aria-hidden />
                <h3 className="text-sm font-semibold text-[#1D1715]">{title}</h3>
              </div>
              <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
                <PolicyBody intro={intro} points={points} href={href} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
