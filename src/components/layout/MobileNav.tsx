'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { findStorefrontGroup, type StorefrontSubCategory } from '@/lib/categories/storefront';
import { resolveCategoryNavImage } from '@/lib/constants/category-nav-images';
import { BLOG_CATEGORY_LINKS } from '@/lib/constants/nav-items';
import { useStorefrontCategories } from '@/lib/hooks/useStorefrontCategories';
import { useAuth } from '@/lib/hooks/useAuth';
import { CurrencySelector } from './CurrencySelector';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const KNOWLEDGE_LINKS = [
  { label: 'Knowledge Hub', href: '/knowledge' },
  { label: 'Navratnas', href: '/knowledge/gemstones' },
  { label: 'Treatments', href: '/knowledge/treatments' },
  { label: 'Energized Gems', href: '/knowledge/energized-gems' },
  { label: 'Gem Care', href: '/knowledge/gems-care' },
  { label: 'Rudraksha Library', href: '/knowledge/rudraksha' },
  { label: 'Rudraksha Qualities', href: '/knowledge/rudraksha-qualities' },
  { label: 'Gems Qualities', href: '/knowledge/gem-qualities' },
  { label: 'Opal Qualities', href: '/knowledge/gem-qualities/opal' },
  { label: 'Vedic Astrology', href: '/knowledge/astrology' },
] as const;

const DIRECT_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

function MobileCategoryThumb({ link }: { link: StorefrontSubCategory }) {
  const thumbImage = resolveCategoryNavImage(link.slug, link.image);
  if (thumbImage) {
    return (
      <span
        style={{ width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        aria-hidden="true"
      >
        <Image src={thumbImage} alt="" width={28} height={28} loading="eager" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </span>
    );
  }
  return (
    <span
      style={{
        width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0, overflow: 'hidden',
        background: `radial-gradient(circle at 35% 30%, #fff 0 12%, ${link.swatch || '#D4A843'} 13% 62%, #5B2E14 100%)`,
      }}
      aria-hidden="true"
    />
  );
}

function AccordionChevron({ open: isOpen }: { open: boolean }) {
  return (
    <span
      style={{
        fontSize: '11px', fontWeight: 700, color: '#7A1515',
        display: 'inline-block',
        transition: 'transform 0.22s',
        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
      }}
    >
      ▶
    </span>
  );
}

function AccordionTrigger({ label, isOpen, onToggle }: { label: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '14px 20px',
        fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: '#3A3A3A', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      {label}
      <AccordionChevron open={isOpen} />
    </button>
  );
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const [expanded, setExpanded] = useState<'gemstones' | 'rudraksha' | 'knowledge' | 'blog' | null>(null);
  const categoryGroups = useStorefrontCategories();
  const { user } = useAuth();

  const navaratna = findStorefrontGroup(categoryGroups, 'navaratna');
  const upratna = findStorefrontGroup(categoryGroups, 'upratna');
  const rudraksha = findStorefrontGroup(categoryGroups, 'rudraksha');

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  const toggle = (key: 'gemstones' | 'rudraksha' | 'knowledge' | 'blog') =>
    setExpanded((prev) => (prev === key ? null : key));

  const GemGrid = ({
    items,
    columns = 2,
    maxItems,
    viewAllHref,
    viewAllLabel = 'Show All →',
  }: {
    items: StorefrontSubCategory[];
    columns?: 2 | 3 | 4;
    maxItems?: number;
    viewAllHref?: string;
    viewAllLabel?: string;
  }) => {
    const visibleItems = maxItems != null ? items.slice(0, maxItems) : items;
    const hasMore = maxItems != null && items.length > maxItems;

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '0 8px' }}>
          {visibleItems.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', textDecoration: 'none', minWidth: 0 }}
            >
              <MobileCategoryThumb link={link} />
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#1C1C1C', lineHeight: 1.3, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                {link.label}
              </span>
            </Link>
          ))}
        </div>
        {hasMore && viewAllHref ? (
          <Link
            href={viewAllHref}
            onClick={onClose}
            style={{
              display: 'block',
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid #EDE6D5',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#7A1515',
              textDecoration: 'none',
            }}
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </>
    );
  };

  const SectionHead = ({ label, href }: { label: string; href: string }) => (
    <Link
      href={href}
      onClick={onClose}
      style={{
        display: 'block', padding: '6px 0 8px',
        fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: '#7A1515', textDecoration: 'none', borderBottom: '1px solid #EDE6D5',
      }}
    >
      {label}
    </Link>
  );

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Drawer */}
      <div
        id="mobDrawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 'min(300px, 88vw)', height: '100%',
          background: '#fff', zIndex: 1110,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          visibility: open ? 'visible' : 'hidden',
          pointerEvents: open ? 'auto' : 'none',
          overflowY: 'auto',
          borderLeft: '3px solid #7A1515',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Sticky header bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10, background: '#fff',
          padding: '14px 20px', borderBottom: '2px solid #7A1515',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7A1515' }}>
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', background: '#F5F0E8', border: 'none', cursor: 'pointer',
              fontSize: '15px', color: '#3A3A3A',
            }}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>

          {/* GEMSTONES accordion */}
          <div style={{ borderBottom: '1px solid #EDE6D5' }}>
            <AccordionTrigger label="Gemstones" isOpen={expanded === 'gemstones'} onToggle={() => toggle('gemstones')} />
            {expanded === 'gemstones' && (
              <div style={{ padding: '0 20px 16px', background: '#FDFCF9' }}>
                <SectionHead label="Navaratna Gems" href="/gemstones/navaratna" />
                <div style={{ paddingTop: '6px' }}><GemGrid items={navaratna.subcategories} /></div>
                <div style={{ marginTop: '12px' }}>
                  <SectionHead label="Upratna Gems" href="/gemstones/upratna" />
                  <div style={{ paddingTop: '6px' }}>
                    <GemGrid
                      items={upratna.subcategories}
                      columns={2}
                      maxItems={15}
                      viewAllHref="/gemstones/upratna"
                      viewAllLabel="Show All Upratna Gems →"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RUDRAKSHA accordion */}
          <div style={{ borderBottom: '1px solid #EDE6D5' }}>
            <AccordionTrigger label="Rudraksha" isOpen={expanded === 'rudraksha'} onToggle={() => toggle('rudraksha')} />
            {expanded === 'rudraksha' && (
              <div style={{ padding: '0 20px 16px', background: '#FDFCF9' }}>
                <GemGrid
                  items={rudraksha.subcategories}
                  columns={3}
                  maxItems={20}
                  viewAllHref="/rudraksha"
                  viewAllLabel="Show All Rudraksha →"
                />
              </div>
            )}
          </div>

          {/* KNOWLEDGE accordion */}
          <div style={{ borderBottom: '1px solid #EDE6D5' }}>
            <AccordionTrigger label="Knowledge" isOpen={expanded === 'knowledge'} onToggle={() => toggle('knowledge')} />
            {expanded === 'knowledge' && (
              <div style={{ padding: '0 0 8px', background: '#FDFCF9' }}>
                {KNOWLEDGE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 20px',
                      fontSize: '12.5px', fontWeight: 600, color: '#3A3A3A',
                      textDecoration: 'none', borderTop: '1px solid #F5F0E8',
                    }}
                  >
                    {link.label}
                    <span style={{ color: '#7A1515', fontSize: '14px' }}>›</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Blog accordion */}
          <div style={{ borderBottom: '1px solid #EDE6D5' }}>
            <AccordionTrigger label="Blog" isOpen={expanded === 'blog'} onToggle={() => toggle('blog')} />
            {expanded === 'blog' && (
              <div style={{ padding: '0 20px 12px' }}>
                {BLOG_CATEGORY_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 0',
                      fontSize: '12.5px', fontWeight: 600, color: '#3A3A3A',
                      textDecoration: 'none', borderTop: '1px solid #F5F0E8',
                    }}
                  >
                    {link.label}
                    <span style={{ color: '#7A1515', fontSize: '14px' }}>›</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Direct links */}
          {DIRECT_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#3A3A3A', borderBottom: '1px solid #EDE6D5', textDecoration: 'none',
              }}
            >
              {item.label}
              <span style={{ color: '#7A1515', fontSize: '16px' }}>›</span>
            </Link>
          ))}

          {/* Account + currency */}
          <div style={{ borderBottom: '1px solid #EDE6D5' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 20px',
                borderBottom: '1px solid #F5F0E8',
              }}
            >
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#3A3A3A',
                }}
              >
                Currency
              </span>
              <CurrencySelector variant="mobile" />
            </div>

            <div
              style={{
                padding: '14px 20px 6px',
                fontSize: '12.5px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#3A3A3A',
              }}
            >
              Account
            </div>

            <Link
              href={user ? '/account' : '/gemstones?auth=login&next=/account'}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px',
                fontSize: '12.5px', fontWeight: 600, color: '#3A3A3A',
                textDecoration: 'none', borderTop: '1px solid #F5F0E8',
              }}
            >
              My Dashboard
              <span style={{ color: '#7A1515', fontSize: '16px' }}>›</span>
            </Link>

            <Link
              href={user ? '/account/orders' : '/gemstones?auth=login&next=/account/orders'}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px',
                fontSize: '12.5px', fontWeight: 600, color: '#3A3A3A',
                textDecoration: 'none', borderTop: '1px solid #F5F0E8',
              }}
            >
              My Orders
              <span style={{ color: '#7A1515', fontSize: '16px' }}>›</span>
            </Link>

            <Link
              href={user ? '/account/saved' : '/gemstones?auth=login&next=/account/saved'}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px',
                fontSize: '12.5px', fontWeight: 600, color: '#3A3A3A',
                textDecoration: 'none', borderTop: '1px solid #F5F0E8',
              }}
            >
              Saved Gems
              <span style={{ color: '#7A1515', fontSize: '16px' }}>›</span>
            </Link>
          </div>

          {/* Consultation CTA */}
          <div style={{ padding: '20px' }}>
            <Link
              href="/#gem-recommendation"
              onClick={onClose}
              style={{
                display: 'block', padding: '14px',
                background: '#7A1515', color: '#fff',
                textAlign: 'center', fontSize: '11.5px', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                borderRadius: '2px', textDecoration: 'none',
              }}
            >
              Book Consultation
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}