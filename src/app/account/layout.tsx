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
    redirect('/?auth=login');
  }

  return (
    <div
      className="min-h-screen pb-16 pt-[130px]"
      style={{ background: 'var(--pvg-bg)' }}
    >
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
