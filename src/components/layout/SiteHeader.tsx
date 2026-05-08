'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  GEMSTONE_NAV_LINKS,
  HEADER_NAV_ITEMS,
  RUDRAKSHA_NAV_LINKS,
  SERVICE_NAV_LINKS,
} from '@/lib/constants/nav-items';
import { useCart } from '@/lib/hooks/useCart';
import { UserAuthButton } from '@/components/auth/UserAuthButton';
import { SearchDialog } from '@/components/layout/SearchDialog';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import { MobileNav } from './MobileNav';

type HeaderNavItem = (typeof HEADER_NAV_ITEMS)[number];

/* ── Inline SVG icons matching the static HTML exactly ─────────────── */
function TruckSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="m16 8 4 1 2 4v3h-6V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}
const ASHOKA_SPOKES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * Math.PI) / 12;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x1: parseFloat((11 + 2.3 * cos).toFixed(6)),
    y1: parseFloat((7.5 + 2.3 * sin).toFixed(6)),
    x2: parseFloat((11 + 1.2 * cos).toFixed(6)),
    y2: parseFloat((7.5 + 1.2 * sin).toFixed(6)),
  };
});

function FlagIN() {
  return (
    <svg width="22" height="15" viewBox="0 0 22 15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ borderRadius: '2px', flexShrink: 0, display: 'block' }}>
      <rect width="22" height="5" fill="#FF9933"/>
      <rect y="5" width="22" height="5" fill="#FFFFFF"/>
      <rect y="10" width="22" height="5" fill="#138808"/>
      <circle cx="11" cy="7.5" r="2.3" fill="none" stroke="#000080" strokeWidth="0.6"/>
      <circle cx="11" cy="7.5" r="0.55" fill="#000080"/>
      {ASHOKA_SPOKES.map((s, i) => (
        <line key={i}
          x1={s.x1} y1={s.y1}
          x2={s.x2} y2={s.y2}
          stroke="#000080" strokeWidth="0.4"
        />
      ))}
    </svg>
  );
}
function FlagGB() {
  return (
    <svg width="22" height="15" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ borderRadius: '2px', flexShrink: 0, display: 'block' }}>
      <rect width="60" height="40" fill="#012169"/>
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#ffffff" strokeWidth="10"/>
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 V40 M0,20 H60" stroke="#ffffff" strokeWidth="13"/>
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8"/>
    </svg>
  );
}
function SearchSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function CartSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function CalendarSvg() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/* ── Topbar item content ─────────────────────────────────────────────── */


function DropdownContent({ item }: { item: HeaderNavItem }) {
  const dropStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #DDD0B4',
    borderTop: '3px solid #7A1515',
    borderRadius: '0 0 6px 6px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
  };

  if (item.dropdown === 'gemstones') {
    return (
      <div style={{ ...dropStyle, width: '620px', padding: '22px 24px 18px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A1515', paddingBottom: '12px', marginBottom: '14px', borderBottom: '1px solid #EDE6D5', fontFamily: "'Roboto', sans-serif" }}>
          Shop By Gem
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px' }}>
          {GEMSTONE_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="pvg-mega-item"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '2px', borderLeft: '2px solid transparent', transition: 'background 0.2s, border-color 0.2s' }}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '3px', flexShrink: 0, background: link.swatch }} />
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1C1C', lineHeight: 1.2, fontFamily: "'Roboto', sans-serif" }}>{link.label}</span>
                <span style={{ fontSize: '11px', color: '#6B5B4E', fontWeight: 500, fontFamily: "'Roboto', sans-serif" }}>{link.planet}</span>
              </span>
            </Link>
          ))}
        </div>
        <Link href="/shop" style={{ display: 'block', padding: '10px 0 0', marginTop: '10px', borderTop: '1px solid #EDE6D5', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A1515', fontFamily: "'Roboto', sans-serif" }}>
          View All Gemstones →
        </Link>
      </div>
    );
  }

  const links = item.dropdown === 'rudraksha' ? RUDRAKSHA_NAV_LINKS : SERVICE_NAV_LINKS;
  return (
    <div style={{ ...dropStyle, minWidth: '230px', padding: '8px 0' }}>
      {links.map((link) => (
        <Link
          key={`${link.href}-${link.label}`}
          href={link.href}
          className="pvg-dd-item"
          style={{ display: 'block', padding: '10px 18px', fontSize: '13px', fontWeight: 500, letterSpacing: '0.02em', color: '#3A3A3A', borderLeft: '2px solid transparent', fontFamily: "'Roboto', sans-serif", transition: 'background 0.2s, color 0.2s, padding-left 0.2s, border-color 0.2s' }}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function DesktopNavLink({ item }: { item: HeaderNavItem }) {
  const hasDropdown = Boolean(item.dropdown);
  return (
    <li
      className="pvg-nav-item"
      style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
    >
      <Link
        href={item.href}
        aria-haspopup={hasDropdown ? 'menu' : undefined}
        className="pvg-nav-link"
        style={{
          display: 'flex', alignItems: 'center', gap: '4px', padding: '0 13px', height: '100%',
          fontSize: '13px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase',
          fontFamily: "'Roboto', sans-serif",
          color: '#3A3A3A', textDecoration: 'none', borderBottom: '2px solid transparent',
          transition: 'color 0.26s, border-color 0.26s', whiteSpace: 'nowrap',
        }}
      >
        {item.label}
        {hasDropdown ? <span aria-hidden="true" style={{ fontSize: '10px', lineHeight: 1 }}>▾</span> : null}
      </Link>
      {hasDropdown ? (
        <div
          className="pvg-nav-drop"
          style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%) translateY(-8px)',
            opacity: 0, visibility: 'hidden', pointerEvents: 'none', zIndex: 1200,
            transition: 'opacity 0.26s ease, transform 0.26s ease, visibility 0s linear 0.26s',
          }}
        >
          <DropdownContent item={item} />
        </div>
      ) : null}
    </li>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cart } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openSearch = () => {
    trackStorefrontEvent('search_open');
    setSearchOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isTyping) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        trackStorefrontEvent('search_open');
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Hover-state CSS matching static HTML exactly */}
      <style>{`
        .pvg-nav-link:hover { color: #7A1515 !important; border-bottom-color: #B8861E !important; }
        .pvg-nav-item:hover .pvg-nav-drop {
          opacity: 1 !important; visibility: visible !important; pointer-events: auto !important;
          transform: translateX(-50%) translateY(0) !important; transition-delay: 0s !important;
        }
        .pvg-dd-item:hover { background: #F5F0E8 !important; color: #7A1515 !important; padding-left: 24px !important; border-left-color: #7A1515 !important; }
        .pvg-mega-item:hover { background: #F5F0E8 !important; border-left-color: #7A1515 !important; }
        .pvg-nav-action { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 0; background: transparent; padding: 0; color: #3A3A3A; cursor: pointer; transition: background 0.2s, color 0.2s; }
        .pvg-nav-icon:hover { background: #F5F0E8 !important; color: #7A1515 !important; }
        .pvg-btn-consult:hover { background: #4D0A0A !important; box-shadow: 0 4px 16px rgba(122,21,21,0.35) !important; transform: translateY(-1px) !important; }
        .pvg-ham:hover { background: #F5F0E8 !important; }
        /* Responsive show/hide — not relying on Tailwind purge */
        .pvg-desk-nav { display: none; }
        .pvg-mob-nav  { display: flex; }
        @media (min-width: 768px) {
          .pvg-desk-nav { display: flex; }
          .pvg-mob-nav  { display: none; }
        }
        .pvg-topbar-track { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
        .pvg-topbar-flow { display: flex; align-items: center; min-width: 0; overflow: hidden; font-family: 'Roboto', sans-serif; }
        .pvg-topbar-location { display: flex; align-items: center; gap: 10px; flex-shrink: 0; font-family: 'Roboto', sans-serif; }
        .pvg-topbar-mobile-locations { display: none; }
        @media (max-width: 1023px) {
          .pvg-topbar-track { padding: 0 !important; overflow: hidden; justify-content: flex-start !important; }
          .pvg-topbar-flow { flex: 0 0 auto; min-width: max-content; overflow: visible !important; animation: pvg-topbar-marquee 24s linear infinite; }
          .pvg-topbar-location { display: none !important; }
          .pvg-topbar-mobile-locations { display: inline-flex; align-items: center; gap: 10px; padding: 0 28px 0 16px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.92); white-space: nowrap; border-left: 1px solid rgba(255,255,255,0.12); }
          .pvg-topbar-flow:hover { animation-play-state: paused; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pvg-topbar-flow { animation: none !important; overflow-x: auto !important; scrollbar-width: none; }
          .pvg-topbar-flow::-webkit-scrollbar { display: none; }
        }
        @keyframes pvg-topbar-marquee {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(calc(100vw - 20px)); }
        }
      `}</style>

      <header
        style={{
          position: 'fixed',
          inset: '0 0 auto 0',
          zIndex: 1000,
          background: '#fff',
          transition: 'box-shadow 0.3s',
          boxShadow: scrolled ? '0 4px 28px rgba(0,0,0,0.10)' : 'none',
        }}
      >
        {/* ── Topbar static desktop / flowing mobile ── */}
        <div
          role="complementary"
          aria-label="Locations and contact"
          style={{
            background: 'linear-gradient(135deg, #5B2E2E 0%, #8B4545 100%)',
            borderBottom: '1px solid rgba(212,168,67,0.35)',
            height: '36px',
          }}
        >
          <div className="pvg-topbar-track" style={{
            maxWidth: '1400px', margin: '0 auto', padding: '0 28px',
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {/* Left: delivery message + phone numbers */}
            <div className="pvg-topbar-flow" style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', fontFamily: "'Roboto', sans-serif" }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                paddingRight: '16px', fontSize: '13px', fontWeight: 600,
                color: '#D4A843', letterSpacing: '0.02em', whiteSpace: 'nowrap',
                borderRight: '1px solid rgba(255,255,255,0.12)', flexShrink: 0,
                fontFamily: "'Roboto', sans-serif",
              }}>
                <TruckSvg />
                Worldwide Safe &amp; Insured Delivery
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '0 16px', fontSize: '13px', fontWeight: 500,
                color: 'rgba(255,255,255,0.92)', letterSpacing: '0.01em', whiteSpace: 'nowrap',
                borderRight: '1px solid rgba(255,255,255,0.12)', flexShrink: 0,
                fontFamily: "'Roboto', sans-serif",
              }}>
                <FlagIN />
                +91-9310172512
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                paddingLeft: '16px', fontSize: '13px', fontWeight: 500,
                color: 'rgba(255,255,255,0.92)', letterSpacing: '0.01em', whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: "'Roboto', sans-serif",
              }}>
                <FlagGB />
                +447831491778
              </span>
              <span className="pvg-topbar-mobile-locations">
                <FlagIN />
                India
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: 300 }}>|</span>
                <FlagGB />
                UK
              </span>
            </div>

            {/* Right: location flags only */}
            <div className="pvg-topbar-location" style={{
              display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
              fontFamily: "'Roboto', sans-serif",
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 600,
                color: 'rgba(255,255,255,0.92)', letterSpacing: '0.01em',
              }}>
                <FlagIN />
                India
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', fontWeight: 300 }}>|</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 600,
                color: 'rgba(255,255,255,0.92)', letterSpacing: '0.01em',
              }}>
                <FlagGB />
                UK
              </span>
            </div>
          </div>
        </div>

        {/* ── Navbar ── */}
        <nav aria-label="Main navigation" style={{ background: '#fff', borderBottom: '2px solid #7A1515' }}>

          {/* Desktop — visible at ≥768 px (md) */}
          <div
          className="pvg-desk-nav"
            style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 28px', height: '74px', alignItems: 'center', gap: '16px' }}
          >
            {/* Logo */}
            <Link href="/" aria-label="Pure Vedic Gems — Home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}>
              <Image src="/PVG NEW LOGO DESIGN.PNG" alt="Pure Vedic Gems emblem" width={48} height={48} priority
                style={{ width: '48px', height: '48px', objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '10px' }}>
                <Image src="/Algerian.png" alt="Pure Vedic Gems" width={150} height={30} priority
                  style={{ width: '150px', height: '30px', objectFit: 'contain', display: 'block' }} />
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#B8861E', marginTop: '3px', paddingLeft: '2px' }}>
                  Since 1937
                </span>
              </div>
            </Link>

            {/* Primary nav */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <ul style={{ display: 'flex', alignItems: 'center', listStyle: 'none', height: '74px', margin: 0, padding: 0 }}>
                {HEADER_NAV_ITEMS.map((item) => (
                  <DesktopNavLink key={item.label} item={item} />
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <button type="button" onClick={openSearch} aria-label="Search"
                className="pvg-nav-icon"
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#3A3A3A', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}>
                <SearchSvg />
              </button>
              <Suspense fallback={<span style={{ width: '40px', height: '40px', display: 'flex' }} />}>
                <UserAuthButton iconSize={18} className="pvg-nav-icon pvg-nav-action" />
              </Suspense>
              <Link href="/cart" aria-label={`Shopping cart, ${cart.item_count} items`}
                className="pvg-nav-icon"
                style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#3A3A3A', transition: 'background 0.2s, color 0.2s' }}>
                <CartSvg />
                <span aria-hidden="true" style={{ position: 'absolute', top: '5px', right: '5px', width: '15px', height: '15px', background: '#7A1515', color: '#fff', fontSize: '8.5px', fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  {cart.item_count > 9 ? '9+' : cart.item_count}
                </span>
              </Link>
              <div aria-hidden="true" style={{ width: '1px', height: '26px', background: '#E2D9C8', margin: '0 6px' }} />
              <Link href="/consultation"
                className="pvg-btn-consult"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', background: '#7A1515', color: '#fff', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Roboto', sans-serif", borderRadius: '2px', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.22s, box-shadow 0.22s, transform 0.15s' }}>
                <CalendarSvg />
                Book Consultation
              </Link>
            </div>
          </div>

          {/* Mobile — visible below md (768 px) */}
          <div className="pvg-mob-nav" style={{ height: '62px', alignItems: 'center', padding: '0 16px' }}>
            <Link href="/" aria-label="Pure Vedic Gems home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}>
              <Image src="/PVG NEW LOGO DESIGN.PNG" alt="Pure Vedic Gems" width={40} height={40} priority
                style={{ width: '40px', height: '40px', objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '10px' }}>
                <Image src="/Algerian.png" alt="Pure Vedic Gems" width={120} height={24} priority
                  style={{ width: '120px', height: '24px', objectFit: 'contain', display: 'block' }} />
                <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#B8861E', marginTop: '2px', paddingLeft: '2px' }}>Since 1937</span>
              </div>
            </Link>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" onClick={openSearch} aria-label="Search"
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#3A3A3A', background: 'none', border: 'none', cursor: 'pointer' }}>
                <SearchSvg />
              </button>
              <Suspense fallback={<span style={{ width: '40px', height: '40px' }} />}>
                <UserAuthButton iconSize={18} className="pvg-nav-icon pvg-nav-action" />
              </Suspense>
              <Link href="/cart" aria-label={`Shopping cart, ${cart.item_count} items`}
                style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#3A3A3A' }}>
                <CartSvg />
                {cart.item_count > 0 ? (
                  <span aria-hidden="true" style={{ position: 'absolute', top: '5px', right: '5px', width: '15px', height: '15px', background: '#7A1515', color: '#fff', fontSize: '8.5px', fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    {cart.item_count > 9 ? '9+' : cart.item_count}
                  </span>
                ) : null}
              </Link>
              {/* Custom 3-line hamburger matching static HTML */}
              <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen} aria-controls="mobDrawer"
                className="pvg-ham"
                style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '2px', transition: 'background 0.2s', marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ display: 'block', height: '1.5px', width: '20px', background: '#3A3A3A', borderRadius: '2px' }} />
                <span style={{ display: 'block', height: '1.5px', width: '14px', background: '#3A3A3A', borderRadius: '2px', alignSelf: 'flex-start', marginLeft: '3px' }} />
                <span style={{ display: 'block', height: '1.5px', width: '20px', background: '#3A3A3A', borderRadius: '2px' }} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}