import crypto from 'crypto';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

type OrderForOwnership = {
  id: string;
  customer_id: string | null;
  guest_access_token?: string | null;
};

/**
 * Caller may act on this pending order (pay / submit bank proof).
 * Authenticated: must be order customer. Guest: pvg_guest_order_token cookie.
 */
export async function canPayOrder(order: OrderForOwnership): Promise<boolean> {
  if (order.customer_id) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return !!user && user.id === order.customer_id;
    } catch {
      return false;
    }
  }

  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get('pvg_guest_order_token')?.value ?? '';
    const [cookieOrderId, guestToken] = cookieValue.split('.');
    if (!guestToken || cookieOrderId !== order.id || !order.guest_access_token) {
      return false;
    }
    const expectedHash = crypto.createHash('sha256').update(guestToken).digest('hex');
    return expectedHash === order.guest_access_token;
  } catch {
    return false;
  }
}
