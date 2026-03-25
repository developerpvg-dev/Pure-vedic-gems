'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { NAV_ITEMS, SITE_CONFIG } from '@/lib/constants/nav-items';
import { MobileNav } from './MobileNav';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const leftLinks = NAV_ITEMS.slice(0, 3);
  const rightLinks = NAV_ITEMS.slice(3);

  const linkCls =
    'relative text-[13px] font-medium uppercase tracking-[1.5px] text-[var(--pvg-muted)] transition-colors hover:text-[var(--pvg-primary)] after:absolute after:-bottom-0.5 after:left-0 after:h-[1.5px] after:w-0 after:bg-[var(--pvg-accent)] after:transition-all hover:after:w-full';

  return (
    <>
      {/*
       * Fixed at top-[32px] to sit BELOW the 32-px TopStrip strip.
       * overflow-visible is required so the arch dome can extend below the nav border.
       */}
      <nav
        className={`fixed inset-x-0 z-[1000] overflow-visible border-b border-[var(--pvg-border)] bg-[var(--pvg-bg)]/97 backdrop-blur-[20px] transition-shadow ${
          scrolled ? 'shadow-[0_4px_24px_rgba(0,0,0,0.07)]' : ''
        }`}
        style={{ top: '32px' }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center px-4 py-1.5 md:px-6">

          {/* ── LEFT LINKS (desktop) ── */}
          <ul className="hidden flex-1 list-none items-center gap-6 lg:flex">
            {leftLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkCls}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* ── HAMBURGER (mobile) ── */}
          <div className="flex flex-1 items-center lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="p-1.5"
            >
              <Menu className="h-5 w-5 text-[var(--pvg-primary)]" />
            </button>
          </div>

          {/* ── CENTRE — Logo with arch dome ── */}
          <div className="relative flex shrink-0 items-center justify-center">
            {/*
             * Arch dome — desktop only.
             * Positioned absolutely so it extends 16px below the nav's border-b,
             * creating the "wider rounded centre" effect the user requested.
             * It has the same bg as the navbar and its own border on 3 sides.
             */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden lg:block"
              aria-hidden
              style={{
                bottom: '-16px',
                borderLeft: '1px solid var(--pvg-border)',
                borderRight: '1px solid var(--pvg-border)',
                borderBottom: '1px solid var(--pvg-border)',
                borderBottomLeftRadius: '50%',
                borderBottomRightRadius: '50%',
                background: 'var(--pvg-bg)',
              }}
            />

            {/* Logo link — sits on top of the arch (z-10) */}
            <Link
              href="/"
              className="relative z-10 flex flex-col items-center px-6 md:px-10 lg:px-16"
              aria-label="PureVedicGems home"
            >
              <div className="relative h-[42px] w-[42px] md:h-[52px] md:w-[52px]">
                <Image
                  src="/PVG NEW LOGO DESIGN.PNG"
                  alt="PureVedicGems Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="relative mt-0.5 h-[16px] w-[120px] md:h-[20px] md:w-[160px]">
                <Image
                  src="/Algerian.png"
                  alt="Pure Vedic Gems"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="mt-0.5 hidden text-[7px] uppercase tracking-[3px] text-[var(--pvg-accent)] sm:block">
                Since {SITE_CONFIG.founded} \u00B7 Four Generations
              </div>
            </Link>
          </div>

          {/* ── RIGHT LINKS + CTA (desktop) ── */}
          <ul className="hidden flex-1 list-none items-center justify-end gap-6 lg:flex">
            {rightLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkCls}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/consultation"
                className="rounded bg-[var(--pvg-primary)] px-4 py-2 text-[12px] font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)] transition-all hover:bg-[var(--pvg-accent)] hover:text-[var(--pvg-primary)] hover:-translate-y-0.5"
              >
                Book Consultation
              </Link>
            </li>
          </ul>

          {/* ── MOBILE RIGHT — small CTA button ── */}
          <div className="flex flex-1 items-center justify-end lg:hidden">
            <Link
              href="/consultation"
              className="rounded bg-[var(--pvg-primary)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1px] text-[var(--pvg-bg)]"
            >
              Consult
            </Link>
          </div>
        </div>
      </nav>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
