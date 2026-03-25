'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants/nav-items';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col overflow-y-auto bg-[var(--pvg-bg)] px-8 pb-12 pt-24"
      role="dialog"
      aria-label="Mobile navigation"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 p-2"
        aria-label="Close menu"
      >
        <X className="h-6 w-6 text-[var(--pvg-primary)]" />
      </button>

      {/* Nav links */}
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="block border-b border-[var(--pvg-border)] py-4 font-heading text-[22px] text-[var(--pvg-primary)] transition-colors hover:text-[var(--pvg-accent)]"
        >
          {item.label}
        </Link>
      ))}

      <Link
        href="/consultation"
        onClick={onClose}
        className="mt-7 w-full bg-[var(--pvg-primary)] py-4 text-center text-sm font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)] transition-colors hover:bg-[var(--pvg-accent)] hover:text-[var(--pvg-primary)]"
      >
        Book Consultation
      </Link>
    </div>
  );
}
