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
  created_at: string;
  updated_at: string;
};

export type CustomerListRow = ProfileStub & {
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

function bumpActivity(
  activityMap: Map<string, string>,
  customerId: string | null | undefined,
  createdAt: string | null | undefined
) {
  if (!customerId || !createdAt) return;
  const current = activityMap.get(customerId);
  if (!current || new Date(createdAt).getTime() > new Date(current).getTime()) {
    activityMap.set(customerId, createdAt);
  }
}

async function fetchActivityMap(customerIds: string[]) {
  const activityMap = new Map<string, string>();
  if (customerIds.length === 0) return activityMap;

  const admin = createAdminClient();
  const chunkSize = 200;

  for (let index = 0; index < customerIds.length; index += chunkSize) {
    const chunk = customerIds.slice(index, index + chunkSize);
    const [
      orders,
      cartEvents,
      consultations,
      yagyaBookings,
      reviews,
      savedItems,
      rewards,
      activityLog,
    ] = await Promise.all([
      admin.from('orders').select('customer_id, created_at').in('customer_id', chunk),
      admin.from('cart_events').select('customer_id, created_at').in('customer_id', chunk),
      admin.from('consultations').select('customer_id, created_at').in('customer_id', chunk),
      admin.from('yagya_bookings').select('customer_id, created_at').in('customer_id', chunk),
      admin.from('reviews').select('customer_id, created_at').in('customer_id', chunk),
      admin.from('saved_items').select('customer_id, created_at').in('customer_id', chunk),
      admin.from('reward_point_transactions').select('customer_id, created_at').in('customer_id', chunk),
      admin
        .from('customer_activity_log')
        .select('customer_id, created_at')
        .in('customer_id', chunk)
        .then((result) => result, () => ({ data: [] as Array<{ customer_id: string; created_at: string }> })),
    ]);

    for (const rows of [
      orders.data,
      cartEvents.data,
      consultations.data,
      yagyaBookings.data,
      reviews.data,
      savedItems.data,
      rewards.data,
      activityLog.data,
    ]) {
      for (const row of rows ?? []) {
        bumpActivity(activityMap, row.customer_id, row.created_at);
      }
    }
  }

  return activityMap;
}

function withActivityTimestamps(
  profiles: ProfileStub[],
  activityMap: Map<string, string>
): CustomerListRow[] {
  return profiles.map((profile) => {
    const lastActivityAt = [
      profile.created_at,
      profile.updated_at,
      activityMap.get(profile.id),
    ]
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0]!;

    return {
      ...profile,
      last_activity_at: lastActivityAt,
    };
  });
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

  if (sort === 'signup') {
    let query = admin
      .from('customer_profiles')
      .select('id, full_name, email, phone, whatsapp, rashi, account_status, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + perPage - 1);

    query = applySearchFilter(query, search);

    const { data, error, count } = await query;
    if (error) throw error;

    const customers = (data ?? []).map((profile) => ({
      ...profile,
      account_status: profile.account_status ?? 'active',
      last_activity_at: profile.updated_at ?? profile.created_at,
    }));

    return {
      customers,
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
      sort,
    };
  }

  let stubQuery = admin
    .from('customer_profiles')
    .select('id, full_name, email, phone, whatsapp, rashi, account_status, created_at, updated_at');

  stubQuery = applySearchFilter(stubQuery, search);

  const { data: profileStubs, error: stubError } = await stubQuery;
  if (stubError) throw stubError;

  const activityMap = await fetchActivityMap((profileStubs ?? []).map((profile) => profile.id));
  const ranked = withActivityTimestamps(profileStubs ?? [], activityMap).sort(
    (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
  );

  const total = ranked.length;
  const customers = ranked.slice(from, from + perPage);

  return {
    customers,
    total,
    page,
    per_page: perPage,
    total_pages: Math.max(1, Math.ceil(total / perPage)),
    sort,
  };
}
