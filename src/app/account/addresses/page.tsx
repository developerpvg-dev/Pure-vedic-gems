import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AddressBookManager } from '@/components/account/AddressBookManager';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
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
    <div className="pvg-account-stack">
      <AccountPageHeader
        title="Address Book"
        subtitle="Create, edit, delete, and choose a default address for checkout and support workflows."
      />
      <AddressBookManager initialAddresses={addresses} />
    </div>
  );
}