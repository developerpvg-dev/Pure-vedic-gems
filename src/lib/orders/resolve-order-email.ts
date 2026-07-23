import { createAdminClient } from '@/lib/supabase/admin';
import type { Order } from '@/lib/types/database';

/** Resolve customer email for transactional mail (guest_email first, else profile). */
export async function resolveOrderCustomerEmail(order: Pick<Order, 'guest_email' | 'guest_name' | 'customer_id'>) {
  if (order.guest_email) {
    return { email: order.guest_email, name: order.guest_name ?? 'Valued Customer' };
  }
  if (!order.customer_id) return null;

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('email, full_name')
    .eq('id', order.customer_id)
    .single();

  if (!profile?.email) return null;
  return { email: profile.email, name: profile.full_name ?? 'Valued Customer' };
}
