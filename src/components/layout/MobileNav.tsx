'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/constants/nav-items';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
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