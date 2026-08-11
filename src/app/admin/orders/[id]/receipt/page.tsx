import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import type { OrderItemRecord, OrderRecord } from '@/lib/types/order';
import { ReceiptPrintBar } from '@/components/admin/ReceiptPrintBar';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import {
  energizationFormFromOrderItems,
  mergeConfigurationDetails,
} from '@/lib/utils/configuration-snapshot';
import {
  isRudrakshaConfigurationSnapshot,
  parseRudrakshaBeadsFromSnapshot,
} from '@/lib/utils/rudraksha-order-display';
import { buildOrderPriceLines } from '@/lib/orders/price-breakdown-lines';
import { parseBankTransferProof } from '@/lib/orders/bank-transfer-proof';
import { parseComplianceFlags } from '@/lib/orders/returns';
import { OrderTaxBreakdownBlock } from '@/components/orders/OrderTaxBreakdownBlock';

export const dynamic = 'force-dynamic';

function fmt(n: number | null | undefined) {
  return '₹' + Number(n ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function cap(s: string | null | undefined) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

const METAL_LABELS: Record<string, string> = {
  gold_22k: '22K Gold',
  gold_18k: '18K Gold',
  gold_14k: '14K Gold',
  silver_925: '925 Sterling Silver',
  panchdhatu: 'Panchdhatu (Without Gold)',
  panchdhatu_with_gold: 'Panchdhatu (With Gold)',
  copper_pital: 'Copper/Pital',
  platinum: 'Platinum',
};

function present(value: ReactNode): boolean {
  return value != null && value !== '' && value !== '—';
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (!present(value)) return null;
  return (
    <div className="flex justify-between gap-3 border-b border-stone-100 py-1 text-[13px] leading-snug">
      <dt className="shrink-0 text-stone-500">{label}</dt>
      <dd className="text-right font-medium text-stone-900 break-words">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 border-t border-stone-200 pt-3 print:mt-3 print:pt-2.5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
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

  const order = raw as unknown as OrderRecord & {
    payment_review_reason?: string | null;
    compliance_flags?: unknown;
    carrier?: string | null;
    delivery_status?: string | null;
    shipped_at?: string | null;
    internal_notes?: string | null;
    admin_notes?: string | null;
    commission_source?: string | null;
    commission_name?: string | null;
    commission_amount?: number | null;
    commissions?: Array<{
      source: 'salesperson' | 'astrologer';
      name: string;
      amount: number;
    }>;
    assigned_designer_id?: string | null;
    design_notes?: string | null;
    design_price?: number | null;
    design_due_at?: string | null;
    product_video_url?: string | null;
    puja_video_url?: string | null;
    amount_verified_at?: string | null;
  };

  const items = ((Array.isArray(order.items) ? order.items : []) as OrderItemRecord[]).map(
    (item) => ({
      ...item,
      name: formatProductDisplayName(item.name),
      configuration_summary: item.configuration_summary
        ? formatProductDisplayName(item.configuration_summary)
        : item.configuration_summary,
    }),
  );

  const configIds = [
    ...new Set(items.map((i) => i.configuration_id).filter((v): v is string => Boolean(v))),
  ];
  const configMap = new Map<string, Record<string, unknown>>();
  if (configIds.length) {
    const { data: configs } = await supabase
      .from('product_configurations')
      .select(
        'id, setting_type, metal, ring_size, chain_length, custom_design_url, gem_price, making_charge, metal_price, certification_fee, energization_fee, total_price, configuration_snapshot, jewelry_designs(name), certification_labs(name, full_name), energization_options(name, duration)',
      )
      .in('id', configIds);
    for (const c of configs ?? []) {
      configMap.set((c as { id: string }).id, c as Record<string, unknown>);
    }
  }

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
    notes: string | null;
    paid_at: string;
  }>;

  let designerName: string | null = null;
  if (order.assigned_designer_id) {
    const { data: designer } = await supabase
      .from('team_members')
      .select('name')
      .eq('id', order.assigned_designer_id)
      .maybeSingle();
    designerName = designer?.name ?? null;
  }

  const amountPaid =
    Number(order.amount_paid ?? 0) ||
    paymentRows.reduce((s, p) => s + Number(p.amount), 0) ||
    (order.payment_status === 'captured' ? Number(order.total) : 0);
  const amountDue =
    order.amount_due != null
      ? Number(order.amount_due)
      : Math.max(0, Number(order.total) - amountPaid);

  const addr = (order.shipping_address ?? {}) as {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  const bankProof = parseBankTransferProof(order.compliance_flags);
  const ceremonyForm = energizationFormFromOrderItems(items);
  const priceLines = buildOrderPriceLines(order);
  const flags = parseComplianceFlags(order.compliance_flags);
  const channel =
    order.order_source === 'offline'
      ? 'Offline / POS'
      : order.payment_method === 'bank_transfer'
        ? 'Online · Bank transfer'
        : 'Online · Razorpay / gateway';

  const hasAddress = Boolean(addr.line1 || addr.city || addr.country);
  const hasDelivery = Boolean(
    order.shipping_method ||
      order.carrier ||
      order.tracking_number ||
      order.tracking_url ||
      order.delivery_status ||
      order.estimated_delivery ||
      order.shipped_at,
  );
  const hasWorkshop = Boolean(
    designerName ||
      order.design_price != null ||
      order.design_due_at ||
      order.design_notes ||
      order.product_video_url ||
      flags.product_video_urls?.length ||
      flags.product_image_urls?.length ||
      order.puja_video_url,
  );
  const hasCommission = Boolean(
    order.commissions?.length ||
      order.commission_source ||
      order.commission_name ||
      order.commission_amount != null,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 print:max-w-none print:px-0 print:py-0 sm:px-6">
      {/* Tight print sheet: no break-inside-avoid on sections (that caused blank page tails). */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm 12mm; }
          html, body { background: #fff !important; overflow: visible !important; }
        }
      `}</style>

      <ReceiptPrintBar orderId={order.id} />

      <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-6">
        <header className="border-b border-stone-200 pb-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                Pure Vedic Gems · Internal order sheet
              </p>
              <h1 className="mt-0.5 font-heading text-xl font-bold leading-tight text-stone-900">
                Order #{order.order_number}
              </h1>
              <p className="mt-0.5 text-xs text-stone-500">{channel}</p>
            </div>
            <p className="text-right text-xs text-stone-500">
              {fmtDate(order.created_at)}
            </p>
          </div>

          <dl className="mt-3 grid gap-x-6 sm:grid-cols-2">
            <Row label="Invoice #" value={order.invoice_number || null} />
            <Row label="Order status" value={cap(order.status)} />
            <Row label="Payment status" value={cap(order.payment_status)} />
            <Row label="Payment method" value={cap(order.payment_method)} />
            <Row
              label="Fulfillment"
              value={cap(order.fulfillment_type || order.shipping_method || 'delivery')}
            />
            <Row
              label="Verified at"
              value={order.amount_verified_at ? fmtDate(order.amount_verified_at) : null}
            />
          </dl>
        </header>

        <Section title="Customer">
          <dl className="grid gap-x-6 sm:grid-cols-2">
            <Row label="Name" value={order.guest_name || null} />
            <Row label="Phone" value={order.guest_phone} />
            <Row label="Email" value={order.guest_email} />
            <Row
              label="Account"
              value={order.customer_id ? 'Registered customer' : 'Guest checkout'}
            />
          </dl>
        </Section>

        {(hasAddress || order.special_instructions) && (
          <Section title="Shipping address">
            <div className="text-[13px] leading-snug text-stone-800">
              {addr.line1 ? <p>{addr.line1}</p> : null}
              {addr.line2 ? <p>{addr.line2}</p> : null}
              {(addr.city || addr.state || addr.pincode) && (
                <p>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
              )}
              {addr.country ? <p>{addr.country}</p> : null}
              {!hasAddress ? (
                <p className="italic text-stone-400">No address recorded</p>
              ) : null}
            </div>
            {order.special_instructions ? (
              <p className="mt-2 border border-stone-100 bg-stone-50 px-2.5 py-1.5 text-[13px]">
                <span className="font-semibold">Special instructions: </span>
                {order.special_instructions}
              </p>
            ) : null}
          </Section>
        )}

        {hasDelivery && (
          <Section title="Delivery / tracking">
            <dl className="grid gap-x-6 sm:grid-cols-2">
              <Row label="Method" value={cap(order.shipping_method)} />
              <Row label="Carrier" value={order.carrier} />
              <Row label="Tracking #" value={order.tracking_number} />
              <Row label="Tracking URL" value={order.tracking_url} />
              <Row label="Delivery status" value={cap(order.delivery_status)} />
              <Row
                label="Est. delivery"
                value={
                  order.estimated_delivery
                    ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : null
                }
              />
              <Row label="Shipped at" value={order.shipped_at ? fmtDate(order.shipped_at) : null} />
            </dl>
          </Section>
        )}

        <Section title={`Items (${items.length})`}>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const cfg = item.configuration_id
                ? (configMap.get(item.configuration_id) as
                    | {
                        configuration_snapshot?: unknown;
                        jewelry_designs?: { name?: string } | null;
                        certification_labs?: { name?: string; full_name?: string | null } | null;
                        energization_options?: { name?: string; duration?: string | null } | null;
                        metal?: string | null;
                        setting_type?: string | null;
                        ring_size?: string | null;
                        chain_length?: string | null;
                        total_price?: number | null;
                      }
                    | undefined)
                : undefined;
              const details =
                cfg || item.configuration_snapshot
                  ? mergeConfigurationDetails({
                      snapshot: item.configuration_snapshot ?? cfg?.configuration_snapshot,
                      dbConfig: cfg as never,
                    })
                  : null;
              const sel = details?.selections;
              const pricing = details?.pricing;
              const rudraksha = isRudrakshaConfigurationSnapshot(
                item.configuration_snapshot ?? cfg?.configuration_snapshot,
              );
              const beads = parseRudrakshaBeadsFromSnapshot(
                item.configuration_snapshot ?? cfg?.configuration_snapshot,
              );

              return (
                <div
                  key={`${item.product_id}-${idx}`}
                  className="border border-stone-200 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-snug text-stone-900">
                        {idx + 1}. {item.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        {[
                          item.sku ? `SKU ${item.sku}` : null,
                          item.tag_number ? `Tag ${item.tag_number}` : null,
                          item.category,
                          item.carat_weight != null ? `${item.carat_weight} ct` : null,
                          item.origin,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {item.configuration_summary ? (
                        <p className="mt-0.5 text-[11px] text-stone-600">{item.configuration_summary}</p>
                      ) : null}
                    </div>
                    <div className="text-right text-[13px]">
                      <p className="font-semibold tabular-nums">{fmt(item.line_total)}</p>
                      <p className="text-[11px] text-stone-500">
                        {fmt(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                  </div>

                  {beads.length > 0 ? (
                    <ul className="mt-2 space-y-0.5 border-t border-stone-100 pt-2 text-[11px]">
                      {beads.map((bead) => (
                        <li key={bead.id} className="flex justify-between gap-2">
                          <span>
                            {bead.role === 'primary' ? 'Primary' : 'Combo'} · {bead.mukhi_label} —{' '}
                            {bead.name}
                            {bead.sku ? ` · SKU ${bead.sku}` : ''}
                            {bead.tag_number ? ` · Tag ${bead.tag_number}` : ''}
                          </span>
                          {bead.price > 0 ? (
                            <span className="tabular-nums">{fmt(bead.price)}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {sel ? (
                    <dl className="mt-2 grid gap-x-4 border-t border-stone-100 pt-1.5 sm:grid-cols-2">
                      <Row
                        label="Setting"
                        value={sel.setting_type ? cap(sel.setting_type) : null}
                      />
                      <Row
                        label="Metal"
                        value={
                          sel.metal
                            ? METAL_LABELS[sel.metal] ?? cap(sel.metal)
                            : null
                        }
                      />
                      <Row label="Ring size" value={sel.ring_size} />
                      <Row label="Chain" value={sel.chain_length} />
                      <Row
                        label="Design"
                        value={sel.design?.name ?? cfg?.jewelry_designs?.name}
                      />
                      <Row
                        label="Certification"
                        value={
                          sel.certification?.name ||
                          (sel.certification_skipped ? 'Skipped' : null)
                        }
                      />
                      <Row
                        label="Energization"
                        value={sel.energization?.name ?? cfg?.energization_options?.name}
                      />
                      <Row
                        label="Delivery ETA"
                        value={details?.delivery_eta?.label || item.delivery_eta_label}
                      />
                    </dl>
                  ) : null}

                  {sel?.energization_form ? (
                    <dl className="mt-1.5 grid gap-x-4 border-t border-stone-50 pt-1.5 sm:grid-cols-2">
                      <Row label="DOB" value={sel.energization_form.dob} />
                      <Row label="Birth time" value={sel.energization_form.birth_time} />
                      <Row label="Birth place" value={sel.energization_form.birth_place} />
                      <Row label="Gotra" value={sel.energization_form.gotra} />
                      <Row label="Rashi" value={sel.energization_form.rashi} />
                      <Row
                        label="Record ceremony"
                        value={sel.energization_form.record_ceremony ? 'Yes' : 'No'}
                      />
                    </dl>
                  ) : null}

                  {pricing &&
                  [
                    pricing.gem_price,
                    pricing.making_charge,
                    pricing.metal_price,
                    pricing.certification_fee,
                    pricing.energization_fee,
                    pricing.diamond_charge,
                    pricing.custom_design_fee,
                  ].some((v) => (v ?? 0) > 0) ? (
                    <dl className="mt-1.5 border-t border-stone-100 pt-1.5">
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                        {rudraksha ? 'Bead / config price' : 'Config price'}
                      </p>
                      <div className="grid gap-x-4 sm:grid-cols-2">
                        <Row
                          label={rudraksha ? 'Bead price' : 'Gem price'}
                          value={(pricing.gem_price ?? 0) > 0 ? fmt(pricing.gem_price) : null}
                        />
                        <Row
                          label="Making"
                          value={(pricing.making_charge ?? 0) > 0 ? fmt(pricing.making_charge) : null}
                        />
                        <Row
                          label="Metal"
                          value={(pricing.metal_price ?? 0) > 0 ? fmt(pricing.metal_price) : null}
                        />
                        <Row
                          label="Certification"
                          value={
                            (pricing.certification_fee ?? 0) > 0
                              ? fmt(pricing.certification_fee)
                              : null
                          }
                        />
                        <Row
                          label="Energization"
                          value={
                            (pricing.energization_fee ?? 0) > 0
                              ? fmt(pricing.energization_fee)
                              : null
                          }
                        />
                        <Row
                          label="Stone add-on"
                          value={(pricing.diamond_charge ?? 0) > 0 ? fmt(pricing.diamond_charge) : null}
                        />
                        <Row
                          label="Custom design"
                          value={
                            (pricing.custom_design_fee ?? 0) > 0
                              ? fmt(pricing.custom_design_fee)
                              : null
                          }
                        />
                        <Row
                          label="Config total"
                          value={fmt(pricing.total ?? cfg?.total_price)}
                        />
                      </div>
                    </dl>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Price breakdown">
          <dl>
            {priceLines.map((line) => (
              <Row
                key={line.key}
                label={line.label}
                value={`${line.sign < 0 ? '−' : ''}${fmt(line.amount)}`}
              />
            ))}
            {order.order_source === 'offline' ? null : (
              <OrderTaxBreakdownBlock
                taxBreakdown={order.tax_breakdown}
                formatMoney={fmt}
                variant="print"
              />
            )}
            <div className="flex justify-between gap-3 border-t border-stone-300 pt-1.5 text-sm font-bold">
              <dt>Grand total</dt>
              <dd className="tabular-nums">{fmt(order.total)}</dd>
            </div>
            <Row label="Amount paid" value={fmt(amountPaid)} />
            <Row label="Balance due" value={fmt(amountDue)} />
          </dl>
        </Section>

        <Section title="Payment">
          <dl className="grid gap-x-6 sm:grid-cols-2">
            <Row label="Method" value={cap(order.payment_method)} />
            <Row label="Status" value={cap(order.payment_status)} />
            <Row label="Razorpay order" value={order.razorpay_order_id} />
            <Row label="Razorpay payment" value={order.razorpay_payment_id} />
            <Row label="Review note" value={order.payment_review_reason} />
          </dl>

          {bankProof ? (
            <div className="mt-2.5 border border-amber-100 bg-amber-50/50 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                Bank transfer proof
              </p>
              <dl className="mt-1 grid gap-x-4 sm:grid-cols-2">
                <Row label="Bank" value={bankProof.bank_label} />
                <Row label="UTR / reference" value={bankProof.reference} />
                <Row label="Notes" value={bankProof.notes} />
                <Row label="Status" value={cap(bankProof.status)} />
                <Row label="Submitted" value={fmtDate(bankProof.submitted_at)} />
                <Row label="Reject reason" value={bankProof.reject_reason} />
                <Row
                  label="Verified"
                  value={bankProof.verified_at ? fmtDate(bankProof.verified_at) : null}
                />
                <Row
                  label="Proof files"
                  value={
                    bankProof.proof_urls.length
                      ? `${bankProof.proof_urls.length} file(s) — see admin order for links`
                      : null
                  }
                />
              </dl>
            </div>
          ) : null}

          {paymentRows.length > 0 ? (
            <ul className="mt-2.5 space-y-1 text-[13px]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                Payment ledger
              </p>
              {paymentRows.map((p, i) => (
                <li
                  key={i}
                  className="flex flex-wrap justify-between gap-2 border-b border-stone-50 pb-1"
                >
                  <span>
                    {fmtDate(p.paid_at)} · {p.kind} · {p.method.replace(/_/g, ' ')}
                    {p.reference ? ` · Ref ${p.reference}` : ''}
                    {p.notes ? ` · ${p.notes}` : ''}
                  </span>
                  <span className="font-semibold tabular-nums">{fmt(p.amount)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>

        {(order.include_energization || ceremonyForm) && (
          <Section title="Ceremony (order level)">
            <dl className="grid gap-x-6 sm:grid-cols-2">
              <Row label="Type" value={cap(order.energization_type)} />
              <Row label="Gotra" value={order.ceremony_gotra || ceremonyForm?.gotra} />
              <Row label="DOB" value={order.ceremony_dob || ceremonyForm?.dob} />
              <Row label="Rashi" value={order.ceremony_rashi || ceremonyForm?.rashi} />
              <Row label="Birth time" value={ceremonyForm?.birth_time} />
              <Row label="Birth place" value={ceremonyForm?.birth_place} />
              <Row
                label="Record ceremony"
                value={
                  order.record_ceremony || ceremonyForm?.record_ceremony ? 'Yes' : 'No'
                }
              />
            </dl>
          </Section>
        )}

        {hasWorkshop && (
          <Section title="Workshop / design">
            <dl className="grid gap-x-6 sm:grid-cols-2">
              <Row label="Designer" value={designerName} />
              <Row
                label="Design price"
                value={order.design_price != null ? fmt(order.design_price) : null}
              />
              <Row
                label="Design due"
                value={order.design_due_at ? fmtDate(order.design_due_at) : null}
              />
              <Row label="Design notes" value={order.design_notes} />
              <Row label="Product video" value={order.product_video_url} />
              <Row
                label="Product videos"
                value={flags.product_video_urls?.join(', ') || null}
              />
              <Row
                label="Product images"
                value={flags.product_image_urls?.join(', ') || null}
              />
              <Row label="Puja video" value={order.puja_video_url} />
            </dl>
          </Section>
        )}

        {hasCommission && (
          <Section title="Commission">
            {(order.commissions?.length
              ? order.commissions
              : [{
                  source: order.commission_source,
                  name: order.commission_name,
                  amount: order.commission_amount,
                }]
            ).map((entry, index) => (
              <dl
                key={index}
                className={
                  index
                    ? 'mt-2 grid gap-x-6 border-t border-stone-100 pt-2 sm:grid-cols-2'
                    : 'grid gap-x-6 sm:grid-cols-2'
                }
              >
                <Row label="Source" value={cap(entry.source)} />
                <Row label="Name" value={entry.name} />
                <Row label="Amount" value={entry.amount != null ? fmt(entry.amount) : null} />
              </dl>
            ))}
          </Section>
        )}

        {(order.internal_notes || order.admin_notes) && (
          <Section title="Internal notes">
            <p className="whitespace-pre-wrap text-[13px] leading-snug text-stone-800">
              {order.internal_notes || order.admin_notes}
            </p>
          </Section>
        )}

        <footer className="mt-5 grid gap-6 border-t border-stone-200 pt-4 text-[12px] print:mt-4 print:gap-4 print:pt-3 sm:grid-cols-2">
          <div>
            <p className="text-stone-500">Prepared by</p>
            <div className="mt-5 border-b border-stone-400" />
          </div>
          <div>
            <p className="text-stone-500">Checked / authorized</p>
            <div className="mt-5 border-b border-stone-400" />
          </div>
        </footer>

        <p className="mt-4 text-center text-[10px] text-stone-400 print:mt-3">
          Internal print sheet · {order.order_number} · Generated {fmtDate(new Date().toISOString())}
        </p>
      </article>
    </div>
  );
}
