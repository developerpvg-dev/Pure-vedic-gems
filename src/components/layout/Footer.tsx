'use client';

import Image from 'next/image';
import Link from 'next/link';
import { findStorefrontGroup, type StorefrontCategoryGroup } from '@/lib/categories/storefront';
import { useStorefrontCategories } from '@/lib/hooks/useStorefrontCategories';

type FooterLinkGroup = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

const STATIC_FOOTER_GROUPS: FooterLinkGroup[] = [
  {
    title: 'Company',
    links: [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about' },
      { label: 'Our Experts', href: '/about/experts' },
      { label: 'Our Stores', href: '/about/stores' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Track Order', href: '/track-order' },
    ],
  },
  {
    title: 'Shop',
    links: [
      { label: 'All Gemstones', href: '/shop' },
      { label: 'Director\'s Pick', href: '/shop/directors-pick' },
      { label: 'Cart', href: '/cart' },
      { label: 'Saved Items', href: '/account/saved' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Consultation', href: '/consultation' },
      { label: 'Gem-to-Jewellery Configurator', href: '/configure' },
      { label: 'Gem Recommendation Tool', href: '/tools/recommendation' },
      { label: 'Carat to Ratti Converter', href: '/tools/carat-to-ratti' },
      { label: 'Ring Size Guide', href: '/tools/ring-size-guide' },
      { label: 'Buying Guides', href: '/knowledge/buying-guides' },
    ],
  },
  {
    title: 'Knowledge',
    links: [
      { label: 'Knowledge Hub', href: '/knowledge' },
      { label: 'Gemstone Guides', href: '/knowledge/gemstones' },
      { label: 'Rudraksha Guides', href: '/knowledge/rudraksha' },
      { label: 'Astrology', href: '/knowledge/astrology' },
      { label: 'Blog', href: '/blog' },
      { label: 'Account', href: '/account' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Privacy Policy', href: '/policies/privacy' },
      { label: 'Terms of Service', href: '/policies/terms' },
      { label: 'Shipping Policy', href: '/policies/shipping' },
      { label: 'Returns Policy', href: '/policies/returns' },
      { label: 'My Orders', href: '/account/orders' },
    ],
  },
];

const CERT_BADGES = ['GIA', 'IGI', 'GRS', 'Gubelin', 'GII', 'IIGJ'];

function uniqueLinks(links: FooterLinkGroup['links']) {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.href}|${link.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function categoryGroupLinks(group: StorefrontCategoryGroup, limit: number): FooterLinkGroup {
  return {
    title: group.label,
    links: uniqueLinks([
      { label: `All ${group.label}`, href: group.href },
      ...group.subcategories.slice(0, limit).map((link) => ({ label: link.label, href: link.href })),
    ]),
  };
}

function buildFooterGroups(groups: StorefrontCategoryGroup[]): FooterLinkGroup[] {
  const navaratna = findStorefrontGroup(groups, 'navaratna');
  const upratna = findStorefrontGroup(groups, 'upratna');
  const rudraksha = findStorefrontGroup(groups, 'rudraksha');
  const idols = findStorefrontGroup(groups, 'idols');
  const jewelry = findStorefrontGroup(groups, 'jewelry');
  const malas = findStorefrontGroup(groups, 'malas');

  return [
    STATIC_FOOTER_GROUPS[0],
    {
      title: 'Shop',
      links: [
        { label: 'All Gemstones', href: '/shop' },
        { label: navaratna.label, href: navaratna.href },
        { label: upratna.label, href: upratna.href },
        { label: rudraksha.label, href: rudraksha.href },
        { label: idols.label, href: idols.href },
        { label: jewelry.label, href: jewelry.href },
        { label: malas.label, href: malas.href },
        { label: 'Director\'s Pick', href: '/shop/directors-pick' },
      ],
    },
    categoryGroupLinks(navaratna, 9),
    categoryGroupLinks(upratna, 8),
    categoryGroupLinks(rudraksha, 8),
    {
      title: 'Collections',
      links: uniqueLinks([
        { label: idols.label, href: idols.href },
        ...idols.subcategories.slice(0, 4).map((link) => ({ label: link.label, href: link.href })),
        { label: jewelry.label, href: jewelry.href },
        ...jewelry.subcategories.slice(0, 4).map((link) => ({ label: link.label, href: link.href })),
        { label: malas.label, href: malas.href },
      ]),
    },
    STATIC_FOOTER_GROUPS[2],
    STATIC_FOOTER_GROUPS[3],
    STATIC_FOOTER_GROUPS[4],
  ];
}

export function Footer() {
  const groups = useStorefrontCategories();
  const footerGroups = buildFooterGroups(groups);

  return (
    <footer className="pvg-footer" id="footer" role="contentinfo">
      <div className="pvg-footer-main">
        <div className="container">
          <div className="pvg-footer-brand-strip">
            <div>
              <div className="pvg-footer-brand-row">
                <Image
                  src="/PVG NEW LOGO DESIGN.webp"
                  alt="Pure Vedic Gems emblem"
                  className="pvg-footer-logo-img"
                  width={96}
                  height={96}
                  sizes="48px"
                />
                <div className="pvg-footer-logo-stack">
                  <Image
                    src="/Algerian.webp"
                    alt="Pure Vedic Gems"
                    className="pvg-footer-logo-wordmark"
                    width={180}
                    height={42}
                    sizes="180px"
                  />
                  <span className="pvg-footer-logo-since">Since 1937</span>
                </div>
              </div>
              <p className="pvg-footer-about">
                For over 87 years and four generations, we have been the most trusted source of authentic, lab-certified Jyotish gemstones and sacred Rudrakshas, serving seekers across 40+ countries.
              </p>
            </div>
            <div className="pvg-footer-socials" aria-label="Social media links">
              <a href="https://www.facebook.com/purevedicgems" className="pvg-social-icon" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
              <a href="https://www.instagram.com/purevedicgems" className="pvg-social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
              <span className="pvg-social-icon" aria-label="YouTube" role="img">
                <svg viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02" /></svg>
              </span>
              <span className="pvg-social-icon" aria-label="LinkedIn" role="img">
                <svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
              </span>
            </div>
          </div>

          <div className="pvg-footer-directory">
            {footerGroups.map((group) => (
              <div className="pvg-footer-link-group" key={group.title}>
                <div className="pvg-footer-col-title">{group.title}</div>
                {group.links.map((link) => (
                  <Link key={`${group.title}-${link.href}-${link.label}`} href={link.href} className="pvg-footer-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="pvg-footer-service-strip">
            <div>
              <div className="pvg-footer-col-title">Our Locations</div>
              <div className="pvg-footer-loc-list">
                <div className="pvg-footer-loc">
                  <div className="pvg-footer-loc-flag">IN</div>
                  <div>
                    <span className="pvg-footer-loc-city">Delhi - Saket</span>
                    <span className="pvg-footer-loc-addr">M-24, GF, Select Citywalk Mall, Saket, New Delhi - 110017</span>
                  </div>
                </div>

                <div className="pvg-footer-loc">
                  <div className="pvg-footer-loc-flag">IN</div>
                  <div>
                    <span className="pvg-footer-loc-city">Noida - Sector 49</span>
                    <span className="pvg-footer-loc-addr">H 65, Sector 49, Noida - 201301, Uttar Pradesh</span>
                  </div>
                </div>

                <div className="pvg-footer-loc">
                  <div className="pvg-footer-loc-flag">UK</div>
                  <div>
                    <span className="pvg-footer-loc-city">London - Hounslow</span>
                    <span className="pvg-footer-loc-addr">219 Staines Rd, Hounslow, London TW3 3JQ, United Kingdom</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="pvg-footer-col-title">Contact &amp; Hours</div>
              <a className="pvg-footer-contact-item" href="tel:+919310172512">
                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L10.91 17a16 16 0 0 0 6.09 6.09l.32-.32a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 21.92z" /></svg>
                +91-9310172512 (India)
              </a>
              <a className="pvg-footer-contact-item" href="tel:+919871582404">
                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L10.91 17a16 16 0 0 0 6.09 6.09l.32-.32a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 21.92z" /></svg>
                +91-9871582404 (India)
              </a>
              <a className="pvg-footer-contact-item" href="tel:+447831491778">
                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L10.91 17a16 16 0 0 0 6.09 6.09l.32-.32a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 21.92z" /></svg>
                +44 7831 491778 (UK)
              </a>

              <p className="pvg-footer-hours">Open Mon, Tue, Thu - Sun: 11am - 8pm<br />Closed on Wednesdays</p>

              <a href="https://wa.me/919310172512" target="_blank" rel="noopener noreferrer" className="pvg-footer-wa">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="pvg-footer-bottom">
        <div className="container pvg-footer-bottom-inner">
          <div className="pvg-footer-copy">&copy; {new Date().getFullYear()} Pure Vedic Gems Pvt. Ltd. All rights reserved. Registered Trademark.</div>
          <div className="pvg-footer-cert-badges">
            {CERT_BADGES.map((badge) => (
              <span className="pvg-footer-cert-badge" key={badge}>{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}