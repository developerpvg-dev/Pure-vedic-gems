'use client';

import Image from 'next/image';
import Link from 'next/link';
import { NewsletterSignupForm } from '@/components/newsletter/NewsletterSignupForm';
import { findStorefrontGroup, type StorefrontCategoryGroup } from '@/lib/categories/storefront';
import { FOOTER_LOCATIONS } from '@/lib/constants/company-addresses';
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
      { label: 'Events & Seminars', href: '/events-and-seminars' },
      { label: 'Video Library', href: '/videos' },
      { label: 'Lab Certificates', href: '/lab-certificate' },
      { label: 'Testimonials', href: '/testimonials' },
      { label: 'Customer Feedback', href: '/feedback' },
    ],
  },
  {
    title: 'Shop',
    links: [
      { label: 'All Gemstones', href: '/shop' },
      { label: "Director's Pick", href: '/shop/directors-pick' },
      { label: 'Cart', href: '/cart' },
      { label: 'Saved Items', href: '/account/saved' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Consultation', href: '/consultation' },
      { label: 'Yagyas', href: '/vedic-yagyas-service' },
      { label: 'Gem-to-Jewellery Configurator', href: '/configure' },
      { label: 'Remedies Recommendation', href: '/gems-recommendations' },
      { label: 'Carat to Ratti Converter', href: '/tools/carat-to-ratti' },
      { label: 'Ring Size Guide', href: '/tools/ring-size-guide' },
    ],
  },
  {
    title: 'Knowledge',
    links: [
      { label: 'Knowledge Hub', href: '/knowledge' },
      { label: 'Gemstone Guides', href: '/knowledge/gemstones' },
      { label: 'Rudraksha Guides', href: '/knowledge/rudraksha' },
      { label: 'Astrology', href: '/knowledge/astrology' },
      { label: 'Treatments', href: '/knowledge/treatments' },
      { label: 'Energized Gems', href: '/knowledge/energized-gems' },
      { label: 'Gems Care', href: '/knowledge/gems-care' },
      { label: 'Blog', href: '/blog' },
      {
        label: 'Nava Durga, Gems & Rudraksha',
        href: '/unveiling-the-mystical-connection-between-gemstones-rudrakshas-and-the-nine-forms-of-goddess-durga',
      },
      { label: 'Account', href: '/account' },
    ],
  },
  {
    title: 'Quality Guides',
    links: [
      { label: 'Gem Qualities Library', href: '/knowledge/gem-qualities' },
      { label: 'Ruby (Manik)', href: '/knowledge/gem-qualities/ruby' },
      { label: 'Emerald (Panna)', href: '/knowledge/gem-qualities/emerald' },
      { label: 'Blue Sapphire (Neelam)', href: '/knowledge/gem-qualities/blue-sapphire' },
      { label: 'Yellow Sapphire (Pukhraj)', href: '/knowledge/gem-qualities/yellow-sapphire' },
      { label: 'White Sapphire', href: '/knowledge/gem-qualities/white-sapphire' },
      { label: 'Red Coral (Moonga)', href: '/knowledge/gem-qualities/red-coral' },
      { label: 'Hessonite (Gomed)', href: '/knowledge/gem-qualities/hessonite' },
      { label: 'Cat’s Eye (Lehsuniya)', href: '/knowledge/gem-qualities/catseye' },
      { label: 'Opal Qualities', href: '/knowledge/gem-qualities/opal' },
      { label: 'Rudraksha Qualities', href: '/knowledge/rudraksha-qualities' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Privacy Policy', href: '/policies/privacy' },
      { label: 'Terms of Service', href: '/policies/terms' },
      { label: 'Shipping Policy', href: '/policies/shipping' },
      { label: 'Returns Policy', href: '/policies/returns' },
      { label: 'Certificate & Trust Center', href: '/policies/certification-trust' },
      { label: 'Treatment Disclosure', href: '/policies/treatment-disclosure' },
      { label: 'No-Franchise Notice', href: '/policies/legal-notice' },
      { label: 'Gemstone Care', href: '/policies/gemstone-care' },
      { label: 'My Orders', href: '/account/orders' },
    ],
  },
];

const CERT_BADGES = ['GIA', 'IGI', 'GRS', 'Gubelin', 'GII', 'IIGJ'];

const INFO_SECTION_TITLES = new Set(['Company', 'Services', 'Knowledge', 'Quality Guides', 'Policies']);

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
        { label: "Director's Pick", href: '/shop/directors-pick' },
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
    STATIC_FOOTER_GROUPS[5],
  ];
}

function FooterLinkColumn({ group }: { group: FooterLinkGroup }) {
  return (
    <div className="pvg-footer-link-group">
      <div className="pvg-footer-col-title">{group.title}</div>
      <ul className="pvg-footer-link-list">
        {group.links.map((link) => (
          <li key={`${group.title}-${link.href}-${link.label}`}>
            <Link href={link.href} className="pvg-footer-link">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const groups = useStorefrontCategories();
  const footerGroups = buildFooterGroups(groups);
  const browseGroups = footerGroups.filter((group) => !INFO_SECTION_TITLES.has(group.title));
  const infoGroups = footerGroups.filter((group) => INFO_SECTION_TITLES.has(group.title));

  return (
    <footer className="pvg-footer" id="footer" role="contentinfo">
      <div className="pvg-footer-main">
        <div className="container">
          <div className="pvg-footer-brand-strip">
            <div className="pvg-footer-brand-copy">
              <div className="pvg-footer-brand-row">
                <Image
                  src="/pvg-emblem.webp"
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
                For over 87 years and four generations, we have been the most trusted source of authentic,
                lab-certified Jyotish gemstones and sacred Rudrakshas, serving seekers across 40+ countries.
              </p>
            </div>

            <div className="pvg-footer-actions">
              <NewsletterSignupForm />
              <div className="pvg-footer-socials" aria-label="Social media links">
                <a href="https://www.facebook.com/puregems.vm" className="pvg-social-icon" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="https://x.com/PureVedicGems" className="pvg-social-icon" aria-label="X" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://www.instagram.com/purevedicgems" className="pvg-social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
                </a>
                <a href="https://www.youtube.com/@purevedicgems" className="pvg-social-icon" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
                <a href="https://wa.me/919310172512" className="pvg-social-icon" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                </a>
              </div>
            </div>
          </div>

          <nav className="pvg-footer-directory" aria-label="Footer navigation">
            <section className="pvg-footer-directory-block" aria-labelledby="pvg-footer-browse-heading">
              <h2 className="pvg-footer-section-heading" id="pvg-footer-browse-heading">
                Shop &amp; Collections
              </h2>
              <div className="pvg-footer-directory-grid">
                {browseGroups.map((group) => (
                  <FooterLinkColumn key={group.title} group={group} />
                ))}
              </div>
            </section>

            <section className="pvg-footer-directory-block" aria-labelledby="pvg-footer-info-heading">
              <h2 className="pvg-footer-section-heading" id="pvg-footer-info-heading">
                Company, Services &amp; Policies
              </h2>
              <div className="pvg-footer-directory-grid pvg-footer-directory-grid--info">
                {infoGroups.map((group) => (
                  <FooterLinkColumn key={group.title} group={group} />
                ))}
              </div>
            </section>
          </nav>

          <div className="pvg-footer-service-strip">
            <div>
              <div className="pvg-footer-col-title">Our Locations</div>
              <div className="pvg-footer-loc-list">
                {FOOTER_LOCATIONS.map((location) => (
                  <div className="pvg-footer-loc" key={location.city}>
                    <div className="pvg-footer-loc-flag">{location.tag}</div>
                    <div>
                      <span className="pvg-footer-loc-city">{location.city}</span>
                      <span className="pvg-footer-loc-addr">{location.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pvg-footer-contact-block">
              <div className="pvg-footer-col-title">Contact &amp; Hours</div>
              <a className="pvg-footer-contact-item" href="tel:+919310172512">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L10.91 17a16 16 0 0 0 6.09 6.09l.32-.32a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 21.92z" /></svg>
                +91-9310172512 (India)
              </a>
              <a className="pvg-footer-contact-item" href="tel:+919871582404">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L10.91 17a16 16 0 0 0 6.09 6.09l.32-.32a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 21.92z" /></svg>
                +91-9871582404 (India)
              </a>
              <a className="pvg-footer-contact-item" href="tel:+447831491778">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L10.91 17a16 16 0 0 0 6.09 6.09l.32-.32a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 21.92z" /></svg>
                +44 7831 491778 (UK)
              </a>
              <p className="pvg-footer-hours">
                Open Mon, Tue, Thu – Sun: 11am – 8pm
                <br />
                Closed on Wednesdays
              </p>
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
          <div className="pvg-footer-copy">
            &copy; {new Date().getFullYear()} Pure Vedic Gems Pvt. Ltd. All rights reserved. Registered Trademark.
          </div>
          <div className="pvg-footer-cert-badges" aria-label="Certification partners">
            {CERT_BADGES.map((badge) => (
              <span className="pvg-footer-cert-badge" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
