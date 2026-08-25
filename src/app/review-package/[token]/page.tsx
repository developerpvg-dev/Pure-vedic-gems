import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { openPackageAddressReviewToken } from '@/lib/orders/package-address-review-token';
import { parsePackageAddressReview } from '@/lib/orders/package-address-review';
import { normalizeHttpsUrlList, parseComplianceFlags } from '@/lib/orders/returns';
import { PackageAddressReviewForm } from '@/components/account/PackageAddressReviewForm';
import { buildMetadata } from '@/lib/utils/seo';

export const metadata = buildMetadata({
  title: 'Confirm package & address | PureVedicGems',
  description: 'Confirm your PureVedicGems packed package and shipping address, or report an issue.',
  path: '/review-package',
  noIndex: true,
});

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ d?: string }>;
};

export default async function ReviewPackagePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { d } = await searchParams;
  const opened = openPackageAddressReviewToken(token);
  if (!opened) notFound();

  const db = asUntypedSupabase(createAdminClient());
  const { data: orderRaw } = await db
    .from('orders')
    .select('id, order_number, compliance_flags')
    .eq('id', opened.orderId)
    .single();

  if (!orderRaw) notFound();

  const order = orderRaw as {
    id: string;
    order_number: string;
    compliance_flags: unknown;
  };

  const review = parsePackageAddressReview(order.compliance_flags);
  if (!review || review.round !== opened.round) notFound();

  const flags = parseComplianceFlags(order.compliance_flags);
  const imageUrls =
    review.image_urls.length > 0
      ? review.image_urls
      : normalizeHttpsUrlList(flags.packing_image_urls);
  if (!imageUrls.length) notFound();

  const prefill = d === 'approve' ? 'approve' : d === 'changes' ? 'changes' : null;

  return (
    <main className="min-h-screen bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="mx-auto max-w-lg px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl text-stone-900">Package & address check</h1>
          <p className="mt-2 text-sm text-stone-600">
            Confirm the packed package and the address on it before we hand it to the courier.
          </p>
        </div>
        <PackageAddressReviewForm
          token={token}
          orderNumber={order.order_number}
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
