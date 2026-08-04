import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { openProductVideoReviewToken } from '@/lib/orders/product-video-review-token';
import { parseProductVideoReview } from '@/lib/orders/product-video-review';
import { normalizeHttpsUrlList, parseComplianceFlags } from '@/lib/orders/returns';
import { ProductVideoReviewForm } from '@/components/account/ProductVideoReviewForm';
import { buildMetadata } from '@/lib/utils/seo';

export const metadata = buildMetadata({
  title: 'Review product design | PureVedicGems',
  description: 'Approve your PureVedicGems product design video or request changes.',
  path: '/review-design',
  noIndex: true,
});

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ d?: string }>;
};

export default async function ReviewDesignPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { d } = await searchParams;
  const opened = openProductVideoReviewToken(token);
  if (!opened) notFound();

  const db = asUntypedSupabase(createAdminClient());
  const { data: orderRaw } = await db
    .from('orders')
    .select('id, order_number, product_video_url, compliance_flags')
    .eq('id', opened.orderId)
    .single();

  if (!orderRaw) notFound();

  const order = orderRaw as {
    id: string;
    order_number: string;
    product_video_url: string | null;
    compliance_flags: unknown;
  };

  const review = parseProductVideoReview(order.compliance_flags);
  if (!review || review.round !== opened.round) notFound();

  const flags = parseComplianceFlags(order.compliance_flags);
  const videoUrls = normalizeHttpsUrlList(flags.product_video_urls);
  const imageUrls = normalizeHttpsUrlList(flags.product_image_urls);
  const videoUrl = review.video_url || videoUrls[0] || order.product_video_url;
  if (!videoUrl) notFound();
  const videos = videoUrls.length ? videoUrls : [videoUrl];

  const prefill = d === 'approve' ? 'approve' : d === 'changes' ? 'changes' : null;

  return (
    <main className="min-h-screen bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="mx-auto max-w-lg px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl text-stone-900">Product design review</h1>
          <p className="mt-2 text-sm text-stone-600">
            Tell us if you are satisfied with the finished piece before we proceed.
          </p>
        </div>
        <ProductVideoReviewForm
          token={token}
          orderNumber={order.order_number}
          videoUrl={videoUrl}
          videoUrls={videos}
          imageUrls={imageUrls}
          round={review.round}
          prefill={prefill}
          alreadyStatus={
            review.status === 'approved' || review.status === 'changes_requested'
              ? review.status
              : null
          }
          alreadyRemarks={review.remarks ?? null}
        />
      </section>
    </main>
  );
}
