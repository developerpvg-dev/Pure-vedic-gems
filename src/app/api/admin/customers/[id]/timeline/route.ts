import { NextResponse } from 'next/server';
import { productHref } from '@/lib/categories/storefront';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

type SavedItemWithProduct = {
  id: string;
  product_id: string;
  created_at: string;
  products: { name: string; slug: string; category: string } | { name: string; slug: string; category: string }[] | null;
};

type CartEventWithProduct = {
  id: string;
  event_type: string;
  quantity: number | null;
  value: number | null;
  created_at: string;
  products: { name: string; slug: string; category: string } | { name: string; slug: string; category: string }[] | null;
};

type TimelineItemType =
  | 'signup'
  | 'login'
  | 'order'
  | 'consultation'
  | 'yagya'
  | 'enquiry'
  | 'review'
  | 'saved_item'
  | 'cart'
  | 'notification'
  | 'in_app'
  | 'reward'
  | 'account_status';

type TimelineItem = {
  id: string;
  type: TimelineItemType;
  title: string;
  subtitle: string | null;
  status: string | null;
  created_at: string;
  href?: string;
};

const TIMELINE_LIMIT = 50;

const CART_EVENT_LABELS: Record<string, string> = {
  cart_item_added: 'Added to cart',
  cart_item_updated: 'Updated cart item',
  cart_item_removed: 'Removed from cart',
  cart_cleared: 'Cart cleared',
};

function buildOrFilter(
  clauses: Array<string | null | undefined>
): string | null {
  const parts = clauses.filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(',') : null;
}

function contactClauses(
  profile: { email: string | null; phone: string | null; whatsapp: string | null },
  fields: { email?: string; phone?: string }
) {
  const clauses: string[] = [];
  if (fields.email && profile.email) clauses.push(`${fields.email}.eq.${profile.email}`);
  if (fields.phone) {
    if (profile.phone) clauses.push(`${fields.phone}.eq.${profile.phone}`);
    if (profile.whatsapp && profile.whatsapp !== profile.phone) {
      clauses.push(`${fields.phone}.eq.${profile.whatsapp}`);
    }
  }
  return clauses;
}

function notificationRecipients(profile: { email: string | null; phone: string | null; whatsapp: string | null }) {
  return [profile.email, profile.phone, profile.whatsapp].filter(Boolean) as string[];
}

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

  const orderOr = buildOrFilter([`customer_id.eq.${id}`, ...contactClauses(profile, { email: 'guest_email', phone: 'guest_phone' })]);
  const consultationOr = buildOrFilter([`customer_id.eq.${id}`, ...contactClauses(profile, { email: 'email', phone: 'phone' })]);
  const yagyaOr = buildOrFilter([`customer_id.eq.${id}`, ...contactClauses(profile, { email: 'email', phone: 'phone' })]);
  const enquiryOr = buildOrFilter(contactClauses(profile, { email: 'email', phone: 'phone' }));
  const notificationOr = buildOrFilter(notificationRecipients(profile).map((recipient) => `recipient.eq.${recipient}`));

  const [
    authUser,
    orders,
    consultations,
    yagyaBookings,
    enquiries,
    reviews,
    savedItems,
    cartEvents,
    notifications,
    inAppNotifications,
    rewards,
    activityLog,
  ] = await Promise.all([
    admin.auth.admin.getUserById(id).then((result) => result.data.user).catch(() => null),
    orderOr
      ? admin.from('orders').select('id, order_number, status, total, created_at, customer_id').or(orderOr).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT)
      : Promise.resolve({ data: [] as Array<{ id: string; order_number: string; status: string; total: number; created_at: string; customer_id: string | null }> }),
    consultationOr
      ? admin.from('consultations').select('id, consultation_type, status, preferred_date, created_at, customer_id').or(consultationOr).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT)
      : Promise.resolve({ data: [] as Array<{ id: string; consultation_type: string | null; status: string; preferred_date: string | null; created_at: string; customer_id: string | null }> }),
    yagyaOr
      ? admin.from('yagya_bookings').select('id, booking_number, yagya_title_snapshot, status, payment_status, amount_inr, created_at, customer_id').or(yagyaOr).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT)
      : Promise.resolve({ data: [] as Array<{ id: string; booking_number: string; yagya_title_snapshot: string; status: string; payment_status: string; amount_inr: number | null; created_at: string; customer_id: string | null }> }),
    enquiryOr
      ? admin.from('enquiries').select('id, subject, source, status, created_at').or(enquiryOr).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT)
      : Promise.resolve({ data: [] as Array<{ id: string; subject: string | null; source: string | null; status: string; created_at: string }> }),
    admin.from('reviews').select('id, product_id, title, rating, is_approved, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT),
    admin.from('saved_items').select('id, product_id, created_at, products(name, slug, category)').eq('customer_id', id).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT),
    admin.from('cart_events').select('id, event_type, quantity, value, created_at, products(name, slug, category)').eq('customer_id', id).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT),
    notificationOr
      ? admin.from('notification_log').select('id, type, template, status, recipient, created_at').or(notificationOr).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT)
      : Promise.resolve({ data: [] as Array<{ id: string; type: string; template: string | null; status: string; recipient: string; created_at: string }> }),
    admin.from('in_app_notifications').select('id, type, title, message, href, created_at').eq('recipient_user_id', id).eq('audience', 'user').order('created_at', { ascending: false }).limit(TIMELINE_LIMIT),
    admin.from('reward_point_transactions').select('id, type, status, points, amount_inr, description, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT),
    admin.from('customer_activity_log').select('id, event_type, title, subtitle, created_at').eq('customer_id', id).order('created_at', { ascending: false }).limit(TIMELINE_LIMIT).then(
      (result) => result,
      () => ({ data: [] as Array<{ id: string; event_type: string; title: string; subtitle: string | null; created_at: string }> })
    ),
  ]);

  const timeline: TimelineItem[] = [
    {
      id: `signup-${profile.id}`,
      type: 'signup',
      title: 'Account created',
      subtitle: profile.email ?? profile.phone ?? profile.whatsapp ?? 'New customer registration',
      status: 'registered',
      created_at: profile.created_at,
    },
    ...((orders.data ?? []).map((order) => ({
      id: order.id,
      type: 'order' as const,
      title: order.order_number,
      subtitle: `Total ₹${Number(order.total).toLocaleString('en-IN')}${order.customer_id ? '' : ' · Guest checkout'}`,
      status: order.status,
      created_at: order.created_at,
      href: `/admin/orders/${order.id}`,
    }))),
    ...((consultations.data ?? []).map((consultation) => ({
      id: consultation.id,
      type: 'consultation' as const,
      title: consultation.consultation_type ?? 'Consultation booking',
      subtitle: consultation.preferred_date
        ? `Preferred date: ${consultation.preferred_date}${consultation.customer_id ? '' : ' · Pre-account booking'}`
        : consultation.customer_id ? 'Consultation request' : 'Pre-account consultation request',
      status: consultation.status,
      created_at: consultation.created_at,
      href: '/admin/leads',
    }))),
    ...((yagyaBookings.data ?? []).map((booking) => ({
      id: booking.id,
      type: 'yagya' as const,
      title: booking.yagya_title_snapshot,
      subtitle: `${booking.booking_number} · ₹${Number(booking.amount_inr ?? 0).toLocaleString('en-IN')}${booking.customer_id ? '' : ' · Pre-account booking'}`,
      status: booking.status ?? booking.payment_status,
      created_at: booking.created_at,
      href: '/admin/yagya-bookings',
    }))),
    ...((enquiries.data ?? []).map((enquiry) => ({
      id: enquiry.id,
      type: 'enquiry' as const,
      title: enquiry.subject ?? 'Customer enquiry',
      subtitle: enquiry.source ? `Source: ${enquiry.source.replace(/_/g, ' ')}` : 'Contact form enquiry',
      status: enquiry.status,
      created_at: enquiry.created_at,
      href: '/admin/leads',
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
        subtitle: 'Added to wishlist',
        status: null,
        created_at: item.created_at,
        href: product ? productHref(product) : undefined,
      };
    })),
    ...(((cartEvents.data ?? []) as unknown as CartEventWithProduct[]).map((event) => {
      const product = Array.isArray(event.products) ? event.products[0] : event.products;
      const label = CART_EVENT_LABELS[event.event_type] ?? event.event_type.replace(/_/g, ' ');
      return {
        id: event.id,
        type: 'cart' as const,
        title: product?.name ? `${label}: ${product.name}` : label,
        subtitle: [
          event.quantity != null ? `Qty ${event.quantity}` : null,
          event.value != null ? `₹${Number(event.value).toLocaleString('en-IN')}` : null,
        ].filter(Boolean).join(' · ') || 'Cart activity',
        status: event.event_type,
        created_at: event.created_at,
        href: product ? productHref(product) : undefined,
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
    ...((inAppNotifications.data ?? []).map((note) => ({
      id: note.id,
      type: 'in_app' as const,
      title: note.title,
      subtitle: note.message,
      status: note.type,
      created_at: note.created_at,
      href: note.href ?? undefined,
    }))),
    ...((rewards.data ?? []).map((reward) => ({
      id: reward.id,
      type: 'reward' as const,
      title: reward.description ?? reward.type.replace(/_/g, ' '),
      subtitle: `${reward.points >= 0 ? '+' : ''}${reward.points.toLocaleString('en-IN')} point(s) · ₹${Number(reward.amount_inr ?? 0).toLocaleString('en-IN')}`,
      status: reward.status,
      created_at: reward.created_at,
      href: '/admin/rewards',
    }))),
    ...((activityLog.data ?? []).map((entry) => ({
      id: entry.id,
      type: (entry.event_type === 'login' ? 'login' : entry.event_type) as TimelineItemType,
      title: entry.title,
      subtitle: entry.subtitle,
      status: entry.event_type,
      created_at: entry.created_at,
    }))),
  ];

  const lastSignInAt = authUser?.last_sign_in_at;
  if (lastSignInAt && lastSignInAt !== profile.created_at) {
    const hasLoggedLogin = (activityLog.data ?? []).some(
      (entry) => entry.event_type === 'login' && entry.created_at === lastSignInAt
    );
    if (!hasLoggedLogin) {
      timeline.push({
        id: `auth-login-${id}`,
        type: 'login',
        title: 'Last login',
        subtitle: 'Most recent sign-in from Supabase Auth',
        status: 'login',
        created_at: lastSignInAt,
      });
    }
  }

  timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    customer: {
      ...profile,
      last_sign_in_at: lastSignInAt ?? null,
    },
    timeline,
  });
}
