import { Award, Gem, PackageCheck, Sparkles } from 'lucide-react';

const ITEMS = [
  {
    icon: Award,
    label: 'Lab Certified',
    iconClass: 'text-[#7A1515]',
    ringClass:
      'bg-[linear-gradient(160deg,#FBECEA_0%,#F3D5D0_100%)] shadow-[inset_0_0_0_1px_rgba(122,21,21,0.14),0_6px_16px_rgba(122,21,21,0.12)]',
  },
  {
    icon: Gem,
    label: 'Natural & Genuine',
    iconClass: 'text-[#1D5335]',
    ringClass:
      'bg-[linear-gradient(160deg,#E8F4EC_0%,#CDE5D6_100%)] shadow-[inset_0_0_0_1px_rgba(29,83,53,0.14),0_6px_16px_rgba(29,83,53,0.12)]',
  },
  {
    icon: Sparkles,
    label: 'Vedic Energization',
    iconClass: 'text-[#9A6B12]',
    ringClass:
      'bg-[linear-gradient(160deg,#FFF6E0_0%,#F5E0A8_100%)] shadow-[inset_0_0_0_1px_rgba(154,107,18,0.18),0_6px_16px_rgba(154,107,18,0.14)]',
  },
  {
    icon: PackageCheck,
    label: 'Insured Delivery',
    iconClass: 'text-[#1E4D6B]',
    ringClass:
      'bg-[linear-gradient(160deg,#E8F1F7_0%,#C9DDE9_100%)] shadow-[inset_0_0_0_1px_rgba(30,77,107,0.14),0_6px_16px_rgba(30,77,107,0.12)]',
  },
] as const;

/** Full-width trust strip — colored icon rings under purchase policies. */
export function ProductAssuranceStrip() {
  return (
    <div
      className="product-assurance-strip mt-5 rounded-xl bg-[linear-gradient(180deg,#FFFCF8_0%,#F8F3EB_100%)] px-3 py-3 sm:mt-6 sm:px-5 sm:py-3.5 lg:mt-7 lg:px-8 lg:py-4"
      aria-label="Purchase assurances"
    >
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-4">
        {ITEMS.map(({ icon: Icon, label, iconClass, ringClass }) => (
          <li key={label} className="group flex min-w-0 flex-col items-center gap-2.5 text-center sm:gap-3">
            <span
              className={`grid h-14 w-14 place-items-center rounded-full transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-[1.04] sm:h-16 sm:w-16 ${ringClass}`}
            >
              <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconClass}`} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="max-w-[8.5rem] text-[10px] font-bold uppercase leading-snug tracking-[0.08em] text-[#3D2B1F] sm:max-w-none sm:text-[11px] lg:text-[12px]">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
