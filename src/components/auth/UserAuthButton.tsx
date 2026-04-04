'use client';

import { useState, useEffect, startTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { UserCircle, LogOut, Package, Heart, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoginModal } from '@/components/auth/LoginModal';

interface UserAuthButtonProps {
  /** Match icon size used in the navbar */
  iconSize?: number;
  className?: string;
}

export function UserAuthButton({
  iconSize = 18,
  className = '',
}: UserAuthButtonProps) {
  const { user, profile, isLoading, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Open login modal when ?auth=login is in the URL
  useEffect(() => {
    if (searchParams.get('auth') === 'login' && !user) {
      startTransition(() => setModalOpen(true));
      // Clean URL without reload
      const params = new URLSearchParams(searchParams.toString());
      params.delete('auth');
      const newUrl = params.size > 0 ? `${pathname}?${params}` : pathname;
      router.replace(newUrl);
    }
  }, [searchParams, user, pathname, router]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = () => setDropdownOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dropdownOpen]);

  if (isLoading) {
    // Skeleton placeholder — prevents layout shift
    return (
      <div
        className={`h-[18px] w-[18px] rounded-full animate-pulse ${className}`}
        style={{ background: 'var(--pvg-border)' }}
        aria-hidden="true"
      />
    );
  }

  // ── NOT LOGGED IN ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          aria-label="Sign in"
          className={`transition-colors hover:text-[var(--pvg-accent)] ${className}`}
          style={{ color: 'var(--pvg-muted)' }}
        >
          <UserCircle
            style={{ height: iconSize, width: iconSize }}
            strokeWidth={1.6}
          />
        </button>

        <LoginModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      </>
    );
  }

  // ── LOGGED IN ─────────────────────────────────────────────────────────────
  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDropdownOpen((v) => !v);
        }}
        aria-label="Account menu"
        aria-expanded={dropdownOpen}
        className="flex items-center gap-1.5 transition-colors hover:text-[var(--pvg-accent)]"
        style={{ color: 'var(--pvg-text)' }}
      >
        {/* Avatar circle */}
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
          style={{ background: 'var(--pvg-accent)' }}
        >
          {initials}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          className="absolute right-0 top-full z-[1100] mt-2 min-w-[200px] overflow-hidden rounded-xl shadow-xl"
          style={{
            background: 'var(--pvg-surface)',
            border: '1px solid var(--pvg-border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* User summary */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--pvg-border)' }}
          >
            <p
              className="text-[13px] font-semibold truncate"
              style={{ color: 'var(--pvg-primary)' }}
            >
              {profile?.full_name ?? 'My Account'}
            </p>
            <p
              className="mt-0.5 text-[11px] truncate"
              style={{ color: 'var(--pvg-muted)' }}
            >
              {user.email ?? user.phone ?? ''}
            </p>
          </div>

          {/* Menu items */}
          {[
            { href: '/account', icon: User, label: 'Dashboard' },
            { href: '/account/orders', icon: Package, label: 'My Orders' },
            { href: '/account/saved', icon: Heart, label: 'Saved Gems' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--pvg-bg-alt)]"
              style={{ color: 'var(--pvg-text)' }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: 'var(--pvg-accent)' }}
              />
              {label}
            </Link>
          ))}

          {/* Divider + Sign out */}
          <div style={{ borderTop: '1px solid var(--pvg-border)' }}>
            <button
              onClick={async () => {
                setDropdownOpen(false);
                await signOut();
                router.push('/');
                router.refresh();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-red-50"
              style={{ color: '#dc2626' }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
