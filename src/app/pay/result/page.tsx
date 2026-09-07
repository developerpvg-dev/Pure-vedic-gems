import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle, Clock3, XCircle } from 'lucide-react';
import { isPayGlocalMerchantTxnId } from '@/lib/payglocal/config';
import { reconcilePayGlocalPayment } from '@/lib/payglocal/reconcile';

export const dynamic = 'force-dynamic';

const COPY = {
  success: {
    title: 'Payment confirmed',
    body: 'Thank you. Your payment has been verified and your booking is saved.',
  },
  pending: {
    title: 'Payment is still confirming',
    body: 'The bank has not finished confirming this payment. Refresh this page in a minute, or check your email / account shortly.',
  },
  failed: {
    title: 'Payment was not completed',
    body: 'No money was captured. You can retry from checkout or contact support with your order or booking reference.',
  },
} as const;

function accountHref(kind: string | undefined) {
  if (kind === 'consultation') return '/account/consultations';
  if (kind === 'yagya') return '/account/yagyas';
  return '/account/orders';
}

export default async function PayGlocalResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string; id?: string; txn?: string }>;
}) {
  const params = await searchParams;
  const raw = params.status === 'success' || params.status === 'pending' ? params.status : 'failed';
  // Callback already settled. Re-poll only while pending/failed — a success reload
  // used to call Get Status then redirect to this same URL, which kept the site loader up.
  if (isPayGlocalMerchantTxnId(params.txn) && raw !== 'success') {
    const result = await reconcilePayGlocalPayment(params.txn, 'webhook');
    const next =
      result.outcome === 'captured' || result.outcome === 'duplicate'
        ? 'success'
        : result.outcome === 'pending' || result.outcome === 'authorized'
          ? 'pending'
          : 'failed';
    if (next !== raw) redirect(result.redirectPath);
  }
  const copy = COPY[raw];
  const Icon = raw === 'success' ? CheckCircle : raw === 'pending' ? Clock3 : XCircle;
  const tone =
    raw === 'success' ? 'text-emerald-700' : raw === 'pending' ? 'text-amber-800' : 'text-red-700';

  const again = new URLSearchParams({
    status: 'pending',
    ...(params.kind ? { kind: params.kind } : {}),
    ...(params.id ? { id: params.id } : {}),
    ...(params.txn ? { txn: params.txn } : {}),
  });

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <Icon className={`mb-4 h-12 w-12 ${tone}`} aria-hidden="true" />
      <h1 className="text-2xl font-semibold text-[#3d2b1f]">{copy.title}</h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">{copy.body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {raw === 'pending' ? (
          <Link
            href={`/pay/result?${again.toString()}`}
            className="rounded-lg bg-[#7A1515] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Check again
          </Link>
        ) : (
          <Link
            href={accountHref(params.kind)}
            className="rounded-lg bg-[#7A1515] px-5 py-2.5 text-sm font-semibold text-white"
          >
            View in account
          </Link>
        )}
        <Link
          href="/"
          className="rounded-lg border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
