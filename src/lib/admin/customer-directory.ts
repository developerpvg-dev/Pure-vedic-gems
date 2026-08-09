import { createAdminClient } from '@/lib/supabase/admin';

export type CustomerSortMode = 'signup' | 'activity';

type ProfileStub = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  rashi: string | null;
  account_status: string;
  addresses: unknown;
  default_address_index: number | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
};

export type CustomerListRow = Omit<ProfileStub, 'last_activity_at'> & {
  last_activity_at: string;
};

function applySearchFilter<T extends { or: (filters: string) => T }>(
  query: T,
  search: string | undefined
) {
  if (!search) return query;
  const searchTerm = `%${search.replace(/[%,]/g, ' ').trim()}%`;
  return query.or(
    `full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},whatsapp.ilike.${searchTerm}`
  );
}

const PROFILE_COLUMNS =
  'id, full_name, email, phone, whatsapp, rashi, account_status, addresses, default_address_index, created_at, updated_at, last_activity_at';

function toListRow(profile: ProfileStub): CustomerListRow {
  return {
    ...profile,
    account_status: profile.account_status ?? 'active',
    // ponytail: fallback until migration_customer_last_activity_at_2026.sql is applied
    last_activity_at: profile.last_activity_at ?? profile.updated_at ?? profile.created_at,
  };
}

export async function listAdminCustomers({
  search,
  page,
  perPage,
  sort,
}: {
  search?: string;
  page: number;
  perPage: number;
  sort: CustomerSortMode;
}) {
  const admin = createAdminClient();
  const from = (page - 1) * perPage;
  const orderColumn = sort === 'activity' ? 'last_activity_at' : 'created_at';

  let query = admin
    .from('customer_profiles')
    .select(PROFILE_COLUMNS, { count: 'exact' })
    .order(orderColumn, { ascending: false })
    .range(from, from + perPage - 1);

  query = applySearchFilter(query, search);

  const { data, error, count } = await query;
  if (error) {
    // Pre-migration fallback: column missing → signup-order pagination only.
    if (sort === 'activity' && /last_activity_at/i.test(error.message)) {
      let fallback = admin
        .from('customer_profiles')
        .select(
          'id, full_name, email, phone, whatsapp, rashi, account_status, addresses, default_address_index, created_at, updated_at',
          { count: 'exact' }
        )
        .order('updated_at', { ascending: false })
        .range(from, from + perPage - 1);
      fallback = applySearchFilter(fallback, search);
      const retry = await fallback;
      if (retry.error) throw retry.error;
      const customers = (retry.data ?? []).map((profile) =>
        toListRow({ ...profile, last_activity_at: profile.updated_at ?? profile.created_at })
      );
      return {
        customers,
        total: retry.count ?? 0,
        page,
        per_page: perPage,
        total_pages: Math.max(1, Math.ceil((retry.count ?? 0) / perPage)),
        sort,
      };
    }
    throw error;
  }

  const customers = ((data ?? []) as ProfileStub[]).map(toListRow);

  return {
    customers,
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
    sort,
  };
}
