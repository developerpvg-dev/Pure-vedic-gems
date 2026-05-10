import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG, NAV_ITEMS } from '@/lib/constants/nav-items';

const FOOTER_LINKS = {
  'Quick Links': NAV_ITEMS.map((i) => ({ label: i.label, href: i.href })),
  Company: [
    { label: 'Our Experts', href: '/about/experts' },
    { label: 'Store Locations', href: '/about/stores' },
    { label: 'Book Consultation', href: '/consultation' },
    { label: 'Blog', href: '/blog' },
  ],
  'Customer Care': [
    { label: 'Track Order', href: '/track-order' },
    { label: 'My Account', href: '/account' },
    { label: 'Saved Gems', href: '/account/saved' },
    { label: 'Shipping Policy', href: '/policies/shipping' },
    { label: 'Returns & Refunds', href: '/policies/returns' },
    { label: 'Privacy Policy', href: '/policies/privacy' },
    { label: 'Terms & Conditions', href: '/policies/terms' },
    { label: 'FAQs', href: '/contact?topic=faq' },
  ],
  Popular: [
    { label: 'Yellow Sapphire', href: '/shop/yellow-sapphire' },
    { label: 'Blue Sapphire', href: '/shop/blue-sapphire' },
    { label: 'Ruby', href: '/shop/ruby' },
    { label: 'Emerald', href: '/shop/emerald' },
    { label: 'Rudraksha', href: '/shop/rudraksha' },
  ],
};

const CERTS = ['GIA', 'IGI', 'GJEPC', 'IIGJ'];
const PRESS = ['Times of India', 'Hindustan Times'];

export function Footer() {
  return (
    <footer className="bg-brand-dark-bg px-6 py-20 text-white/55 md:px-20">
      {/* Large brand name */}
      <div className="mb-15 border-b border-white/8 pb-15 text-center">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/PVG NEW LOGO DESIGN.webp"
            alt="Pure Vedic Gems Logo"
            width={60}
            height={60}
            className="object-contain"
          />
          <Image
            src="/Algerian.webp"
            alt="Pure Vedic Gems"
            width={180}
            height={40}
            className="object-contain brightness-0 invert opacity-80"
            style={{ width: '180px', height: '40px' }}
          />
        </div>
        <div className="mt-2.5 text-[10px] uppercase tracking-[7px] text-white/25">
          Est. {SITE_CONFIG.founded} · Heritage Vedic Gemstones
        </div>
      </div>

      {/* Link grid */}
      <div className="mx-auto grid max-w-300 gap-12 md:grid-cols-2 lg:grid-cols-5">
        {/* Brand column */}
        <div>
          <h5 className="mb-5 text-[10px] font-bold uppercase tracking-[3px] text-brand-accent">
            About
          </h5>
          <p className="max-w-67.5 text-sm leading-7 text-white/40">
            {SITE_CONFIG.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CERTS.map((c) => (
              <span
                key={c}
                className="border border-white/15 px-3 py-1 text-[10px] tracking-wider text-white/35"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <h5 className="mb-5 text-[10px] font-bold uppercase tracking-[3px] text-brand-accent">
              {title}
            </h5>
            <ul className="list-none space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/45 transition-colors hover:text-brand-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-13 flex max-w-300 flex-col items-center gap-2.5 border-t border-white/7 pt-6 text-xs text-white/28 md:flex-row md:justify-between">
        <span>
          © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
        </span>
        <div className="flex items-center gap-2">
          <span className="mr-1 text-[10px]">As seen in</span>
          {PRESS.map((p) => (
            <span
              key={p}
              className="bg-white/4 px-2.5 py-1 text-[10px] tracking-wider text-white/30"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
