import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ReviewSubmissionPanel, type ReviewEligibleItem } from '@/components/account/ReviewSubmissionPanel';
import { parseOrderItems, isReviewEligibleStatus } from '@/lib/customer/orders';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import type { Order, Review } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Reviews | PureVedicGems',
};

export default async function AccountReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/shop?auth=login&next=/account/reviews');

  const [ordersResult, reviewsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, status, items')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, product_id, order_id, rating, title, is_approved, is_featured, created_at')
      .eq('customer_id', user.id),
  ]);

  const reviews = (reviewsResult.data ?? []) as Review[];
  const reviewByPurchase = new Map(reviews.map((review) => [`${review.order_id}:${review.product_id}`, review.id]));
  const eligibleItems: ReviewEligibleItem[] = ((ordersResult.data ?? []) as Pick<Order, 'id' | 'order_number' | 'status' | 'items'>[])
    .filter((order) => isReviewEligibleStatus(order.status))
    .flatMap((order) => parseOrderItems(order.items).map((item) => item.product_id ? {
      product_id: item.product_id,
      order_id: order.id,
      order_number: order.order_number,
      product_name: item.name ?? 'Purchased product',
      image_url: item.image_url ?? null,
      existing_review_id: reviewByPurchase.get(`${order.id}:${item.product_id}`) ?? null,
    } : null))
    .filter((item): item is ReviewEligibleItem => item !== null);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/account" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--pvg-muted)] hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Account
        </Link>
        <h1 className="font-heading text-3xl text-[var(--pvg-primary)] md:text-4xl">My Reviews</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pvg-muted)]">Submit verified purchase reviews after delivery. Public ratings are shown only after moderation.</p>
        <OrnamentalDivider className="mt-4 max-w-[200px]" />
      </div>
      <ReviewSubmissionPanel items={eligibleItems} />
    </div>
  );
}