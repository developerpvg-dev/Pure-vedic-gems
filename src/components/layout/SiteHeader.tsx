'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, ShoppingBag } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants/nav-items';
import { useCart } from '@/lib/hooks/useCart';
import { MobileNav } from './MobileNav';
import { UserAuthButton } from '@/components/auth/UserAuthButton';

/* ── contact marquee items ── */
const STRIP = [
  '\u{1F4DE} +91-9871582404',
  '\u2709\uFE0F info@purevedicgems.com',
  '\u{1F4CD} Delhi \u00B7 Noida \u00B7 London',
  '\u{1F69A} Insured Worldwide Shipping',
  '\u{1F4DE} +91-9310172512',
  '\u{1F4CD} Saket \u00B7 Sultanpur \u00B7 Hounslow UK',
];
const MARQUEE = [...STRIP, ...STRIP];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cart } = useCart();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const allLinks = NAV_ITEMS;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[1000] transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_2px_28px_rgba(0,0,0,0.09)]' : ''
        }`}
      >
        {/* ─── ROW 1: Marquee strip ─── */}
        <div className="overflow-hidden bg-[var(--pvg-primary)]" style={{ height: '30px' }}>
          <div
            className="animate-marquee flex h-full items-center whitespace-nowrap text-[10.5px] tracking-wide text-white/90"
            style={{ animationDuration: '36s', width: 'max-content' }}
          >
            {MARQUEE.map((item, i) => (
              <span key={i} className="inline-flex shrink-0 items-center px-5">
                <span>{item}</span>
                <span className="ml-5 text-white/25">|</span>
              </span>
            ))}
          </div>
        </div>

        {/* ─── ROW 2: Main navbar ─── */}
        <nav
          className="border-b border-[var(--pvg-border)] bg-[var(--pvg-bg)] backdrop-blur-[20px]"
          style={{ background: scrolled ? 'rgba(var(--pvg-bg-rgb, 255,252,247),0.97)' : 'var(--pvg-bg)' }}
        >
          {/* ── Desktop ── */}
          <div className="mx-auto hidden max-w-[1380px] items-center px-10 py-2.5 lg:flex">
            {/* Left nav links */}
            <ul className="flex flex-1 list-none items-center gap-8">
              {allLinks.slice(0, 3).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative pb-0.5 text-[13px] font-semibold uppercase tracking-[1.8px] text-[var(--pvg-text)] transition-colors hover:text-[var(--pvg-accent)] after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-[var(--pvg-accent)] after:transition-all hover:after:w-full"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Centre logo */}
            <Link
              href="/"
              aria-label="PureVedicGems home"
              className="group flex shrink-0 flex-col items-center px-8"
            >
              <div className="relative h-[44px] w-[44px] transition-transform duration-300 group-hover:scale-105">
                <Image src="/PVG NEW LOGO DESIGN.PNG" alt="PureVedicGems" fill className="object-contain" priority />
              </div>
              <div className="relative mt-0.5 h-[15px] w-[130px]">
                <Image src="/Algerian.png" alt="Pure Vedic Gems" fill className="object-contain" priority />
              </div>
            </Link>

            {/* Right nav links + actions */}
            <div className="flex flex-1 items-center justify-end gap-8">
              <ul className="flex list-none items-center gap-8">
                {allLinks.slice(3).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="relative pb-0.5 text-[13px] font-semibold uppercase tracking-[1.8px] text-[var(--pvg-text)] transition-colors hover:text-[var(--pvg-accent)] after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-[var(--pvg-accent)] after:transition-all hover:after:w-full"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {/* Icon actions */}
              <div className="flex items-center gap-4 border-l border-[var(--pvg-border)] pl-6">
                <button aria-label="Search" className="text-[var(--pvg-muted)] transition-colors hover:text-[var(--pvg-accent)]">
                  <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
                </button>
                <Link href="/cart" aria-label={`Cart (${cart.item_count} items)`} className="relative text-[var(--pvg-muted)] transition-colors hover:text-[var(--pvg-accent)]">
                  <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  {cart.item_count > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--pvg-accent)] text-[9px] font-black text-white">
                      {cart.item_count > 9 ? '9+' : cart.item_count}
                    </span>
                  )}
                </Link>
                <Suspense fallback={<div className="h-[18px] w-[18px]" />}>
                  <UserAuthButton iconSize={18} />
                </Suspense>
                <Link
                  href="/consultation"
                  className="ml-1 rounded-sm bg-[var(--pvg-primary)] px-5 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)] transition-all hover:bg-[var(--pvg-accent)] hover:text-[var(--pvg-primary)] hover:-translate-y-0.5"
                >
                  Book Consultation
                </Link>
              </div>
            </div>
          </div>

          {/* ── Mobile / Tablet ── */}
          {/* Order: Logo | Search | Cart | Consult | Menu */}
          <div className="flex items-center gap-2 px-4 py-2 lg:hidden">
            {/* Leftmost: Logo */}
            <Link href="/" className="flex shrink-0 flex-col items-center" aria-label="PureVedicGems home">
              <div className="relative h-[34px] w-[34px]">
                <Image src="/PVG NEW LOGO DESIGN.PNG" alt="PureVedicGems" fill className="object-contain" priority />
              </div>
              <div className="relative mt-0.5 h-[12px] w-[100px]">
                <Image src="/Algerian.png" alt="Pure Vedic Gems" fill className="object-contain" priority />
              </div>
            </Link>

            {/* Flex spacer pushes actions to the right */}
            <div className="flex-1" />

            {/* Search */}
            <button aria-label="Search" className="p-1.5 text-[var(--pvg-muted)] transition-colors hover:text-[var(--pvg-accent)]">
              <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>

            {/* Cart */}
            <Link href="/cart" aria-label={`Cart (${cart.item_count} items)`} className="relative p-1.5 text-[var(--pvg-muted)] transition-colors hover:text-[var(--pvg-accent)]">
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.6} />
              {cart.item_count > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--pvg-accent)] text-[9px] font-black text-white">
                  {cart.item_count > 9 ? '9+' : cart.item_count}
                </span>
              )}
            </Link>

            {/* User / Auth */}
            <Suspense fallback={<div className="h-[18px] w-[18px] p-1.5" />}>
              <UserAuthButton iconSize={18} className="p-1.5" />
            </Suspense>

            {/* Consult */}
            <Link
              href="/consultation"
              className="rounded-sm bg-[var(--pvg-primary)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[1px] text-[var(--pvg-bg)]"
            >
              Consult
            </Link>

            {/* Rightmost: Hamburger menu */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-1.5 transition-colors hover:bg-[var(--pvg-surface)]"
            >
              <Menu className="h-5 w-5 text-[var(--pvg-primary)]" />
            </button>
          </div>
        </nav>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}