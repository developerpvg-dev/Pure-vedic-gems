import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import type { OrderItemRecord, OrderRecord } from '@/lib/types/order';
import { ReceiptPrintBar } from '@/components/admin/ReceiptPrintBar';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';

export const dynamic = 'force-dynamic';

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function OrderReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);

  const { data: raw } = await supabase.from('orders').select('*').eq('id', id).single();
  if (!raw) notFound();

  const order = raw as unknown as OrderRecord;
  const items = ((Array.isArray(order.items) ? order.items : []) as OrderItemRecord[]).map((item) => ({
    ...item,
    name: formatProductDisplayName(item.name),
    configuration_summary: item.configuration_summary
      ? formatProductDisplayName(item.configuration_summary)
      : item.configuration_summary,
  }));

  const { data: payments } = await db
    .from('order_payments')
    .select('*')
    .eq('order_id', id)
    .order('paid_at', { ascending: true });

  const paymentRows = (payments ?? []) as Array<{
    amount: number;
    method: string;
    kind: string;
    reference: string | null;
    paid_at: string;
  }>;

  const amountPaid =
    Number(order.amount_paid ?? 0) ||
    paymentRows.reduce((s, p) => s + Number(p.amount), 0) ||
    (order.payment_status === 'captured' ? Number(order.total) : 0);
  const amountDue =
    order.amount_due != null
      ? Number(order.amount_due)
      : Math.max(0, Number(order.total) - amountPaid);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <ReceiptPrintBar orderId={order.id} />

      <article className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none sm:p-8">
        <header className="border-b border-stone-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
            Pure Vedic Gems
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-stone-900">Order receipt</h1>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Order #</dt>
              <dd className="font-semibold">{order.order_number}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Invoice #</dt>
              <dd className="font-semibold">{order.invoice_number || '—'}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Date</dt>
              <dd>{fmtDate(order.created_at)}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Channel</dt>
              <dd className="capitalize">{order.order_source ?? 'online'}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Customer</dt>
              <dd>
                {order.guest_name || '—'}
                {order.guest_phone ? ` · ${order.guest_phone}` : ''}
                {order.guest_email ? ` · ${order.guest_email}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Fulfillment</dt>
              <dd className="capitalize">
                {(order.fulfillment_type || order.shipping_method || 'delivery').replace(/_/g, ' ')}
              </dd>
            </div>
          </dl>
        </header>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={`${item.product_id}-${idx}`} className="border-b border-stone-100">
                <td className="py-3 pr-2">
                  <p className="font-medium text-stone-900">{item.name}</p>
                  {item.configuration_summary ? (
                    <p className="text-xs text-stone-500">{item.configuration_summary}</p>
                  ) : null}
                  {item.sku || item.tag_number ? (
                    <p className="text-xs text-stone-400">
                      {[item.sku, item.tag_number].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}
                </td>
                <td className="py-3 pr-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-3 text-right tabular-nums">{fmt(Number(item.line_total) || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between gap-6">
            <dt className="text-stone-500">Subtotal</dt>
            <dd className="tabular-nums">{fmt(Number(order.subtotal) || 0)}</dd>
          </div>
          {(Number(order.jewelry_charges) || 0) +
            (Number(order.metal_charges) || 0) +
            (Number(order.certification_charges) || 0) +
            (Number(order.energization_charges) || 0) >
          0 ? (
            <div className="flex justify-between gap-6">
              <dt className="text-stone-500">Making / metal / cert / puja</dt>
              <dd className="tabular-nums">
                {fmt(
                  (Number(order.jewelry_charges) || 0) +
                    (Number(order.metal_charges) || 0) +
                    (Number(order.certification_charges) || 0) +
                    (Number(order.energization_charges) || 0),
                )}
              </dd>
            </div>
          ) : null}
          {(Number(order.discount) || 0) > 0 ? (
            <div className="flex justify-between gap-6 text-emerald-800">
              <dt>Discount</dt>
              <dd className="tabular-nums">-{fmt(Number(order.discount) || 0)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-6">
            <dt className="text-stone-500">GST</dt>
            <dd className="tabular-nums">{fmt(Number(order.gst_amount) || 0)}</dd>
          </div>
          {(Number(order.shipping_cost) || 0) > 0 ? (
            <div className="flex justify-between gap-6">
              <dt className="text-stone-500">Shipping</dt>
              <dd className="tabular-nums">{fmt(Number(order.shipping_cost) || 0)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-6 border-t border-stone-200 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{fmt(Number(order.total) || 0)}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-stone-500">Amount paid</dt>
            <dd className="tabular-nums text-emerald-700">{fmt(amountPaid)}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-stone-500">Balance due</dt>
            <dd className={`tabular-nums font-semibold ${amountDue > 0.009 ? 'text-amber-800' : ''}`}>
              {fmt(amountDue)}
            </dd>
          </div>
        </dl>

        {paymentRows.length > 0 ? (
          <section className="mt-8 border-t border-stone-200 pt-5">
            <h2 className="text-sm font-bold text-stone-900">Payments</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {paymentRows.map((p, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-stone-50 pb-2">
                  <span>
                    {fmtDate(p.paid_at)} · {p.kind} · {p.method.replace(/_/g, ' ')}
                    {p.reference ? ` · Ref ${p.reference}` : ''}
                  </span>
                  <span className="font-semibold tabular-nums">{fmt(Number(p.amount))}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {order.special_instructions ? (
          <p className="mt-6 text-sm text-stone-600">
            <span className="font-semibold text-stone-800">Notes:</span> {order.special_instructions}
          </p>
        ) : null}

        <footer className="mt-10 grid gap-8 border-t border-stone-200 pt-8 text-sm sm:grid-cols-2">
          <div>
            <p className="text-stone-500">Customer signature</p>
            <div className="mt-8 border-b border-stone-400" />
          </div>
          <div>
            <p className="text-stone-500">Authorized signature</p>
            <div className="mt-8 border-b border-stone-400" />
          </div>
        </footer>

        <p className="mt-8 text-center text-xs text-stone-400">
          Thank you for choosing Pure Vedic Gems. This is a store receipt; GST tax invoice issued separately when required.
        </p>
      </article>
    </div>
  );
}
