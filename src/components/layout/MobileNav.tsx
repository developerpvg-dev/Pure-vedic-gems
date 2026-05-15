'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/constants/nav-items';
import { useStorefrontCategories } from '@/lib/hooks/useStorefrontCategories';
import type { StorefrontSubCategory } from '@/lib/categories/storefront';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

function MobileCategoryThumb({ link }: { link: StorefrontSubCategory }) {
  const shellStyle = {
    width: '26px',
    height: '26px',
    borderRadius: '8px',
    flexShrink: 0,
    overflow: 'hidden',
  };

  if (link.image) {
    return (
      <span style={shellStyle} aria-hidden="true">
        <Image src={link.image} alt="" width={26} height={26} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </span>
    );
  }

  return (
    <span
      style={{
        ...shellStyle,
        background: `radial-gradient(circle at 35% 30%, #fff 0 12%, ${link.swatch || '#D4A843'} 13% 62%, #5B2E14 100%)`,
      }}
      aria-hidden="true"
    />
  );
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const categoryGroups = useStorefrontCategories();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Overlay — matching static .mob-overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          background: 'rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Drawer — matching static .mob-drawer */}
      <div
        id="mobDrawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(300px, 88vw)',
          height: '100%',
          background: '#fff',
          zIndex: 1110,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          visibility: open ? 'visible' : 'hidden',
          pointerEvents: open ? 'auto' : 'none',
          overflowY: 'auto',
          padding: '72px 20px 40px',
          borderLeft: '3px solid #7A1515',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: '#F5F0E8',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#3A3A3A',
          }}
        >
          ✕
        </button>

        {/* Nav links — matching static .mob-link */}
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="pvg-mob-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#3A3A3A',
              borderBottom: '1px solid #EDE6D5',
              transition: 'color 0.2s',
              textDecoration: 'none',
            }}
          >
            {item.label}
            <span style={{ color: '#7A1515', fontSize: '16px', lineHeight: 1 }}>›</span>
          </Link>
        ))}

        <div style={{ marginTop: '20px' }}>
          {categoryGroups.map((group) => (
            <div key={group.slug} style={{ marginBottom: '18px' }}>
              <Link
                href={group.href}
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '0 0 8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#7A1515',
                  textDecoration: 'none',
                  borderBottom: '1px solid #EDE6D5',
                }}
              >
                {group.label}
              </Link>
              <div style={{ display: 'grid', gridTemplateColumns: group.slug === 'idols' || group.slug === 'jewelry' || group.slug === 'malas' ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '6px 8px', paddingTop: '8px' }}>
                {group.subcategories.slice(0, 8).map((link) => (
                  <Link
                    key={`${group.slug}-${link.href}-${link.label}`}
                    href={link.href}
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      minWidth: 0,
                      padding: '7px 0',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#3A3A3A',
                      textDecoration: 'none',
                    }}
                  >
                    <MobileCategoryThumb link={link} />
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Consultation CTA — matching static .mob-consult */}
        <Link
          href="/consultation"
          onClick={onClose}
          style={{
            display: 'block',
            marginTop: '24px',
            padding: '14px',
            background: '#7A1515',
            color: '#fff',
            textAlign: 'center',
            fontSize: '11.5px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: '2px',
            textDecoration: 'none',
          }}
        >
          Book Consultation
        </Link>
      </div>

      <style>{`
        .pvg-mob-link:hover { color: #7A1515 !important; }
      `}</style>
    </>
  );
}