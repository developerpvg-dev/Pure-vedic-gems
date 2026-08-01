import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { openRingSizeConfirmToken } from '@/lib/orders/ring-size-confirmation-token';
import { parseRingSizeConfirmation } from '@/lib/orders/ring-size-confirmation';
import { RingSizeConfirmForm } from '@/components/account/RingSizeConfirmForm';
import { buildMetadata } from '@/lib/utils/seo';

export const metadata = buildMetadata({
  title: 'Confirm ring size | PureVedicGems',
  description: 'Upload your ring internal diameter measurement photo.',
  path: '/confirm-ring-size',
  noIndex: true,
});

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function ConfirmRingSizePage({ params }: PageProps) {
  const { token } = await params;
  const opened = openRingSizeConfirmToken(token);
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

  const confirmation = parseRingSizeConfirmation(order.compliance_flags);
  if (!confirmation) notFound();

  return (
    <main className="min-h-screen bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="mx-auto max-w-lg px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl text-stone-900">Ring size confirmation</h1>
          <p className="mt-2 text-sm text-stone-600">
            Help us verify your internal diameter before we craft your ring.
          </p>
        </div>
        <RingSizeConfirmForm
          token={token}
          orderNumber={order.order_number}
          alreadyImageUrl={confirmation.image_url ?? null}
        />
      </section>
    </main>
  );
}
