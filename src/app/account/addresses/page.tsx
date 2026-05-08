import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AddressBookManager } from '@/components/account/AddressBookManager';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import { parseCustomerAddresses } from '@/lib/customer/address-book';
import type { CustomerProfile } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Address Book | PureVedicGems',
  description: 'Manage shipping addresses and GST details for your PureVedicGems account.',
};

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/shop?auth=login&next=/account/addresses');

  const { data: profileData } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const profile = profileData as CustomerProfile | null;
  const addresses = parseCustomerAddresses(profile?.addresses ?? [], profile?.default_address_index ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/account" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--pvg-muted)] hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Account
        </Link>
        <h1 className="font-heading text-3xl text-[var(--pvg-primary)] md:text-4xl">Address Book</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pvg-muted)]">Create, edit, delete, and choose a default address for checkout and support workflows.</p>
        <OrnamentalDivider className="mt-4 max-w-[200px]" />
      </div>
      <AddressBookManager initialAddresses={addresses} />
    </div>
  );
}