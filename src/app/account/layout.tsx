import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ReactNode } from 'react';

interface AccountLayoutProps {
  children: ReactNode;
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/shop?auth=login&next=/account');
  }

  return (
    <div
      className="min-h-screen pb-16 pt-32.5"
      style={{ background: 'var(--pvg-bg)' }}
    >
      <div className="mx-auto max-w-275 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
