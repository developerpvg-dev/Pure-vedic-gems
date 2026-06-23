import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ReactNode } from 'react';
import './account-page.css';

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
    <div className="pvg-account-page font-body text-[#15110d]">
      <div className="pvg-account-inner">{children}</div>
    </div>
  );
}
