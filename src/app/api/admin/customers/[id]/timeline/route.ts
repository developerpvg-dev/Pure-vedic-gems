import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

type SavedItemWithProduct = {
  id: string;
  product_id: string;
  created_at: string;
  products: { name: string; slug: string; category: string } | { name: string; slug: string; category: string }[] | null;
};

type TimelineItem = {
  id: string;
  type: 'order' | 'consultation' | 'review' | 'saved_item' | 'notification';
  title: string;
  subtitle: string | null;
  status: string | null;
  created_at: string;
  href?: string;
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('customer_profiles')
    .select('id, full_name, email, phone, whatsapp, created_at')
    .eq('id', id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const [orders, consultations, reviews, savedItems, notifications] = await Promise.all([
    admin.from('orders').select('id, order_number, status, total, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(20),
    admin.from('consultations').select('id, consultation_type, status, preferred_date, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(20),
    admin.from('reviews').select('id, product_id, title, rating, is_approved, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(20),
    admin.from('saved_items').select('id, product_id, created_at, products(name, slug, category)').eq('customer_id', id).order('created_at', { ascending: false }).limit(20),
    admin.from('notification_log').select('id, type, template, status, recipient, created_at').or(`recipient.eq.${profile.email ?? ''},recipient.eq.${profile.phone ?? ''},recipient.eq.${profile.whatsapp ?? ''}`).order('created_at', { ascending: false }).limit(20),
  ]);

  const timeline: TimelineItem[] = [
    ...((orders.data ?? []).map((order) => ({
      id: order.id,
      type: 'order' as const,
      title: order.order_number,
      subtitle: `Total ₹${Number(order.total).toLocaleString('en-IN')}`,
      status: order.status,
      created_at: order.created_at,
      href: `/admin/orders/${order.id}`,
    }))),
    ...((consultations.data ?? []).map((consultation) => ({
      id: consultation.id,
      type: 'consultation' as const,
      title: consultation.consultation_type ?? 'Consultation',
      subtitle: consultation.preferred_date,
      status: consultation.status,
      created_at: consultation.created_at,
    }))),
    ...((reviews.data ?? []).map((review) => ({
      id: review.id,
      type: 'review' as const,
      title: review.title ?? `${review.rating ?? 0}-star review`,
      subtitle: review.is_approved ? 'Approved public review' : 'Pending moderation',
      status: review.is_approved ? 'approved' : 'pending',
      created_at: review.created_at,
    }))),
    ...(((savedItems.data ?? []) as unknown as SavedItemWithProduct[]).map((item) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        id: item.id,
        type: 'saved_item' as const,
        title: product?.name ?? 'Saved item',
        subtitle: 'Wishlist activity',
        status: null,
        created_at: item.created_at,
        href: product ? `/shop/${product.category}/${product.slug}` : undefined,
      };
    })),
    ...((notifications.data ?? []).map((log) => ({
      id: log.id,
      type: 'notification' as const,
      title: log.template ?? log.type,
      subtitle: log.recipient,
      status: log.status,
      created_at: log.created_at,
    }))),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ customer: profile, timeline });
}