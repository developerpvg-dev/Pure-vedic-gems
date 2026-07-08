import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { ReactNode } from 'react';
import './account-page.css';

interface AccountLayoutProps {
  children: ReactNode;
}

// Auth-recovery pages under /account that must stay reachable without a session.
const PUBLIC_RECOVERY_PATHS = new Set([
  '/account/forgot-password',
]);

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const headerList = await headers();
  const pathname = headerList.get('x-account-path') ?? '';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !PUBLIC_RECOVERY_PATHS.has(pathname)) {
    redirect('/shop?auth=login&next=/account');
  }

  return (
    <div className="pvg-account-page font-body text-[#15110d]">
      <div className="pvg-account-inner">{children}</div>
    </div>
  );
}
